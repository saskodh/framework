import { ConfigurationUtil, ConfigurationData } from "../decorators/ConfigurationDecorator";
import { ComponentUtil } from "../decorators/ComponentDecorator";
import { Injector } from "./Injector";
import { Dispatcher } from "../dispatcher/Dispatcher";
import { Router } from "express";
import * as _ from "lodash";
import { LifeCycleHooksUtil } from "../decorators/LifeCycleHooksDecorators";
import { ProcessHandler } from "../helpers/ProcessHandler";

export class ApplicationContextState {
    static NOT_INITIALIZED = 'NOT_INITIALIZED';
    static INITIALIZING = 'INITIALIZING';
    static READY = 'READY';
}

export class ApplicationContext {

    private static ACTIVE_PROFILE_PROPERTY_KEY = 'application.profiles.active';

    private state: ApplicationContextState;
    private injector: Injector;
    private dispatcher: Dispatcher;
    private configurationData: ConfigurationData;
    private unRegisterExitListenerCallback: Function;

    constructor(configurationClass) {
        this.state = ApplicationContextState.NOT_INITIALIZED;
        this.injector = new Injector();
        this.dispatcher = new Dispatcher();
        this.configurationData = ConfigurationUtil.getConfigurationData(configurationClass);
        this.configurationData.loadAllProperties();
        this.configurationData.loadAllComponents();
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

    /**
     * Starts the application context by initializing the DI components container.
     * */
    async start() {
        if (this.state !== ApplicationContextState.NOT_INITIALIZED) {
            console.warn("Application context was already initialized or it is initializing at the moment.");
        }

        this.state = ApplicationContextState.INITIALIZING;
        await this.initializeComponents();
        await this.wireComponents();
        await this.executePostConstruction();
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

            // todo pass the comp constructor through the registered definition post processors
            // configurationData.componentDefinitionPostProcessorFactory
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
            injectionData.properties.forEach((propertyKey, fieldName) => {
                Reflect.set(instance, fieldName, this.getConfigurationProperty(propertyKey));
            });

            this.dispatcher.processAfterInit(CompConstructor, instance);

            // todo pass through the post processors configurationData.componentPostProcessorFactory
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
        let activeProfile = this.getActiveProfile();
        return _.filter(this.configurationData.componentFactory.components, (CompConstructor) => {
            let profile = ComponentUtil.getComponentData(CompConstructor).profile;
            if (profile) {
                return profile === activeProfile;
            }
            return true;
        });
    }

    private getActiveProfile(): string {
        return this.getConfigurationProperty(ApplicationContext.ACTIVE_PROFILE_PROPERTY_KEY);
    }

    private getConfigurationProperty(propertyKey: string): string {
        return process.env[propertyKey] || this.configurationData.properties.get(propertyKey);
    }

    private verifyContextReady() {
        if (this.state !== ApplicationContextState.READY) {
            throw new Error('Application context is not yet initialized. Start method needs to be called first.');
        }
    }
}