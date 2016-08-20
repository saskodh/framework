import { ConfigurationUtil, ConfigurationData } from "../decorators/ConfigurationDecorator";
import { ComponentUtil } from "../decorators/ComponentDecorator";
import { Injector } from "./Injector";
import { Dispatcher } from "../web/Dispatcher";
import { Router } from "express";
import * as _ from "lodash";
import { LifeCycleHooksUtil } from "../decorators/LifeCycleHooksDecorators";
import { ProcessHandler } from "../helpers/ProcessHandler";
import { IComponentPostProcessor, ComponentPostProcessorUtil } from "../processors/ComponentPostProcessor";
import {
    IComponentDefinitionPostProcessor, ComponentDefinitionPostProcessorUtil
} from "../processors/ComponentDefinitionPostProcessor";
import { OrderUtil } from "../decorators/OrderDecorator";
import { Environment } from "./Environment";

export class ApplicationContextState {
    static NOT_INITIALIZED = 'NOT_INITIALIZED';
    static INITIALIZING = 'INITIALIZING';
    static READY = 'READY';
}
import {DynamicDependencyResolver} from "./DynamicDependencyResolver";

export class ApplicationContext {

    private state: ApplicationContextState;
    private injector: Injector;
    private dispatcher: Dispatcher;
    private environment: Environment;
    private configurationData: ConfigurationData;
    private unRegisterExitListenerCallback: Function;

    constructor(configurationClass) {
        this.state = ApplicationContextState.NOT_INITIALIZED;
        this.injector = new Injector();
        this.dispatcher = new Dispatcher();
        this.configurationData = ConfigurationUtil.getConfigurationData(configurationClass);
        this.initializeEnvironment();
        this.configurationData.loadAllComponents(this.environment);
    }

    getComponent <T>(componentClass): T {
        this.verifyContextReady();
        return <T> this.injector.getComponent(ComponentUtil.getClassToken(componentClass));
    }

    getComponentWithToken <T>(token: Symbol): T {
        this.verifyContextReady();
        return <T> this.injector.getComponent(token);
    }

    getComponentsWithToken <T>(token: Symbol): Array<T> {
        this.verifyContextReady();
        return <Array<T>> this.injector.getComponents(token);
    }

    getRouter(): Router {
        this.verifyContextReady();
        return this.dispatcher.getRouter();
    }

    getEnvironment(): Environment {
        return this.environment;
    }

    /**
     * Starts the application context by initializing the DI components container.
     * */
    async start() {
        if (this.state !== ApplicationContextState.NOT_INITIALIZED) {
            console.warn("Application context was already initialized or it is initializing at the moment.");
        }

        await this.initializeDefinitionPostProcessors();
        await this.initializePostProcessors();

        await this.postProcessDefinition();

        this.state = ApplicationContextState.INITIALIZING;
        await this.initializeComponents();
        await this.wireComponents();

        await this.postProcessBeforeInit();

        await this.executePostConstruction();
        await this.dispatcher.postConstruct();

        await this.postProcessAfterInit();

        this.state = ApplicationContextState.READY;
    }

    /**
     * Manually destroys the application context. Running @PreDestroy method on all components.
     */
    async destroy() {
        if (this.state === ApplicationContextState.READY) {
            await this.executePreDestruction();
        }
        this.dispatcher = null;
        this.injector = null;
        if (_.isFunction(this.unRegisterExitListenerCallback)) {
            this.unRegisterExitListenerCallback();
        }
        this.state = ApplicationContextState.NOT_INITIALIZED;
    }

    /**
     * Registers hook on process exit event for destroying the application context.
     * Registers process.exit() on process SIGINT event.
     */
    registerExitHook() {
        this.unRegisterExitListenerCallback = ProcessHandler.getInstance().registerOnExitListener(() => this.destroy());
    }

    private initializeComponents() {
        for (let CompConstructor of this.getActiveComponents()) {
            let componentData = ComponentUtil.getComponentData(CompConstructor);

            let instance = new CompConstructor();
            this.injector.register(componentData.classToken, instance);
            for (let token of componentData.aliasTokens) {
                this.injector.register(token, instance);
            }
        }
    }

    private wireComponents() {
        for (let CompConstructor of this.getActiveComponents()) {
            let componentData = ComponentUtil.getComponentData(CompConstructor);
            let injectionData = ComponentUtil.getInjectionData(CompConstructor);
            let instance = this.injector.getComponent(componentData.classToken);

            injectionData.dependencies.forEach((dependencyData, fieldName) => {
                let dependency = dependencyData.isArray ? this.injector.getComponents(dependencyData.token) :
                    this.injector.getComponent(dependencyData.token);
                Reflect.set(instance, fieldName, dependency);
            });
            injectionData.dynamicDependencies.forEach((dependencyData, fieldName) => {
               let dynamicResolver = new DynamicDependencyResolver(this.injector, dependencyData);
                Object.defineProperty(instance, fieldName, dynamicResolver.getPropertyDescriptor());
            });
            injectionData.properties.forEach((propertyKey, fieldName) => {
                Reflect.set(instance, fieldName, this.environment.getProperty(propertyKey));
            });

            this.dispatcher.processAfterInit(CompConstructor, instance);
        }
    }

    private initializeDefinitionPostProcessors() {
        for (let CompConstructor of this.getActiveDefinitionPostProcessors()) {
            let componentData = ComponentUtil.getComponentData(CompConstructor);

            let instance = new CompConstructor();
            if (!ComponentDefinitionPostProcessorUtil.isIComponentDefinitionPostProcessor(instance)) {
                throw new Error('Components annotated with @ComponentDefinitionPostProcessor must implement the ' +
                    'IComponentDefinitionPostProcessor interface');
            }

            this.injector.register(componentData.classToken, instance);
            for (let token of componentData.aliasTokens) {
                this.injector.register(token, instance);
            }
        }
    }

    private initializePostProcessors() {
        for (let CompConstructor of this.getActivePostProcessors()) {
            let componentData = ComponentUtil.getComponentData(CompConstructor);

            let instance = new CompConstructor();
            if (!ComponentPostProcessorUtil.isIComponentPostProcessor(instance)) {
                throw new Error('Components annotated with @ComponentPostProcessor must implement the ' +
                    'IComponentPostProcessor interface');
            }

            this.injector.register(componentData.classToken, instance);
            for (let token of componentData.aliasTokens) {
                this.injector.register(token, instance);
            }
        }
    }

    private async postProcessDefinition() {
        this.configurationData.componentFactory.components = _.map(
            this.configurationData.componentFactory.components, (componentDefinition) => {
                for (let componentDefinitionPostProcessor of this.getOrderedDefinitionPostProcessors()) {
                    let result = componentDefinitionPostProcessor.postProcessDefinition(componentDefinition);
                    if (_.isFunction(result)) {
                        componentDefinition = result;
                    } else if (!_.isUndefined(result)) {
                        throw new Error('Component Definition Post Processor must return a constructor function');
                    }
                }
                return componentDefinition;
            });
    }

    private async postProcessBeforeInit() {
        for (let componentPostProcessor of this.getOrderedPostProcessors()) {

            for (let componentConstructor of this.getActiveComponents()) {
                let componentData = ComponentUtil.getComponentData(componentConstructor);
                let instance = this.injector.getComponent(componentData.classToken);
                componentPostProcessor.postProcessBeforeInit(instance);
            }
        }
    }

    private async postProcessAfterInit() {
        for (let componentPostProcessor of this.getOrderedPostProcessors()) {

            for (let componentConstructor of this.getActiveComponents()) {
                let componentData = ComponentUtil.getComponentData(componentConstructor);
                let instance = this.injector.getComponent(componentData.classToken);
                componentPostProcessor.postProcessAfterInit(instance);
            }
        }
    }

    private async executePostConstruction() {
        let postConstructInvocations = [];
        for (let CompConstructor of this.getActiveComponents()) {
            let componentData = ComponentUtil.getComponentData(CompConstructor);
            let postConstructMethod = LifeCycleHooksUtil.getConfig(CompConstructor).postConstructMethod;
            if (postConstructMethod) {
                let instance = this.injector.getComponent(componentData.classToken);
                if (!_.isFunction(instance[postConstructMethod])) {
                    throw new Error(`@PostConstruct is not on a method (${postConstructMethod})`);
                }
                let invocationResult = instance[postConstructMethod]();
                postConstructInvocations.push(invocationResult);
            }
        }
        await Promise.all(postConstructInvocations);
    }

    private async executePreDestruction() {
        let preDestroyInvocations = [];
        for (let CompConstructor of this.getActiveComponents()) {
            let componentData = ComponentUtil.getComponentData(CompConstructor);
            let preDestroyMethod = LifeCycleHooksUtil.getConfig(CompConstructor).preDestroyMethod;
            if (preDestroyMethod) {
                let instance = this.injector.getComponent(componentData.classToken);
                if (!_.isFunction(instance[preDestroyMethod])) {
                    throw new Error(`@PreDestroy is not on a method (${preDestroyMethod})`);
                }
                let invocationResult = instance[preDestroyMethod]();
                preDestroyInvocations.push(invocationResult);
            }
        }
        await Promise.all(preDestroyInvocations);
    }

    private getActiveComponents() {
        return _.filter(this.configurationData.componentFactory.components, (CompConstructor) => {
            let profiles = ComponentUtil.getComponentData(CompConstructor).profiles;
            if (profiles.length > 0) {
                let notUsedProfiles = _.map(_.filter(profiles, (profile) => (profile[0] === '!')),
                    (profile: string) => profile.substr(1));
                return _.some(notUsedProfiles, (profile) => !this.environment.acceptsProfiles(profile))
                    || this.environment.acceptsProfiles(...profiles);
            }
            return true;
        });
    }

    private getActiveDefinitionPostProcessors() {
        let activeProfiles = this.environment.getActiveProfiles();
        let definitionPostProcessors = _.filter(
            this.configurationData.componentDefinitionPostProcessorFactory.components, (CompConstructor) => {
                let profiles = ComponentUtil.getComponentData(CompConstructor).profiles;
                if (profiles.length === 0) {
                    return true;
                }
                for (let profile of profiles) {
                    for (let activeProfile of activeProfiles) {
                        return profile === activeProfile;
                    }
                }
            });
        return OrderUtil.orderList(definitionPostProcessors);
    }

    private getActivePostProcessors() {
        let activeProfiles = this.environment.getActiveProfiles();
        let postProcessors = _.filter(
            this.configurationData.componentPostProcessorFactory.components, (CompConstructor) => {
                let profiles = ComponentUtil.getComponentData(CompConstructor).profiles;
                if (profiles.length === 0) {
                    return true;
                }
                for (let profile of profiles) {
                    for (let activeProfile of activeProfiles) {
                        return profile === activeProfile;
                    }
                }
            });
        return OrderUtil.orderList(postProcessors);
    }

    // return the definitionPostProcessors ordered by the value extracted if it implements the IOrdered interface
    private getOrderedDefinitionPostProcessors(): Array<IComponentDefinitionPostProcessor> {
        let definitionPostProcessors = [];
        for (let componentDefinitionPostProcessor of this.getActiveDefinitionPostProcessors()) {
            let componentData = ComponentUtil.getComponentData(componentDefinitionPostProcessor);
            let definitionPostProcessor = <IComponentDefinitionPostProcessor> this.injector
                .getComponent(componentData.classToken);

            definitionPostProcessors.push(definitionPostProcessor);
        }
        return definitionPostProcessors;
    }

    // return the postProcessors ordered by the value extracted if it implements the IOrdered interface
    private getOrderedPostProcessors() {
        let postProcessors = [];
        for (let componentPostProcessor of this.getActivePostProcessors()) {
            let componentData = ComponentUtil.getComponentData(componentPostProcessor);
            let postProcessor = <IComponentPostProcessor> this.injector.getComponent(componentData.classToken);

            postProcessors.push(postProcessor);
        }
        return postProcessors;
    }

    private initializeEnvironment() {
        this.environment = new Environment();
        this.environment.setActiveProfiles(...this.configurationData.activeProfiles);
        this.environment.setApplicationProperties(this.configurationData.propertySourcePaths);
        this.injector.register(ComponentUtil.getComponentData(Environment).classToken, this.environment);
    }

    private verifyContextReady() {
        if (this.state !== ApplicationContextState.READY) {
            throw new Error('Application context is not yet initialized. Start method needs to be called first.');
        }
    }
}