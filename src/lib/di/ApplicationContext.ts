import {ConfigurationUtil, ConfigurationData} from "../decorators/ConfigurationDecorator";
import {ComponentUtil} from "../decorators/ComponentDecorator";
import {Injector} from "./Injector";
import {AsyncEngineComponentDefinitionPostProcessor} from "../processors/impl/AsyncEngineComponentDefinitionPostProcessor";
import {Dispatcher} from "../dispatcher/Dispatcher";
import {Router} from "express";
import * as _ from "lodash";
import {LifeCycleHooksUtil} from "../decorators/LifeCycleHooksDecorators";

export class ApplicationContext {

    private static ACTIVE_PROFILE_PROPERTY_KEY = 'application.profiles.active';

    private injector:Injector;
    private dispatcher:Dispatcher;
    private configurationData:ConfigurationData;

    constructor(configurationClass) {
        this.injector = new Injector();
        this.dispatcher = new Dispatcher();
        this.configurationData = ConfigurationUtil.getConfigurationData(configurationClass);

        this.initializeComponents();
        this.wireComponents();
        this.executePostConstruction();
    }

    getComponent <T>(componentClass):T {
        return <T> this.injector.getComponent(ComponentUtil.getClassToken(componentClass));
    }

    getComponentWithToken <T>(token:Symbol):T {
        return <T> this.injector.getComponent(token);
    }

    getComponentsWithToken <T>(token:Symbol):Array<T> {
        return <Array<T>> this.injector.getComponents(token);
    }

    getRouter():Router {
        return this.dispatcher.getRouter();
    }

    /**
     * Manually destroys the application context. Running @PreDestroy method on all components.
     */
    destroy() {
        this.executePreDestruction();
    }

    /**
     * Registers hook on process exit event for destroying the application context.
     */
    registerExitHook() {
        process.on('exit', (code) => {
            console.log(`Process is exiting with code: ${code}, running pre destruction...`);
            this.destroy();
        });
    }

    private initializeComponents() {
        var asyncEngine = AsyncEngineComponentDefinitionPostProcessor.getInstance();
        for (let CompConstructor of this.getActiveComponents()) {
            var componentData = ComponentUtil.getComponentData(CompConstructor);

            // todo pass the comp constructor through the registered definition post processors
            // configurationData.componentDefinitionPostProcessorFactory

            var PostProcessedComponentConstructor = asyncEngine.postProcessDefinition(CompConstructor);

            let instance = new PostProcessedComponentConstructor();
            this.injector.register(componentData.classToken, instance);
            for (let token of componentData.aliasTokens) {
                this.injector.register(token, instance);
            }
        }
    }

    private wireComponents() {
        for (let CompConstructor of this.getActiveComponents()) {
            var componentData = ComponentUtil.getComponentData(CompConstructor);
            let injectionData = ComponentUtil.getInjectionData(CompConstructor);
            var instance = this.injector.getComponent(componentData.classToken);

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

    private executePostConstruction() {
        for (let CompConstructor of this.getActiveComponents()) {
            var componentData = ComponentUtil.getComponentData(CompConstructor);
            let postConstructMethod = LifeCycleHooksUtil.getConfig(CompConstructor).postConstructMethod;
            if (postConstructMethod) {
                let instance = this.injector.getComponent(componentData.classToken);
                if (!_.isFunction(instance[postConstructMethod])) {
                    throw new Error(`@PostConstruct is not on a method (${postConstructMethod})`);
                }
                instance[postConstructMethod]();
            }
        }
    }

    private executePreDestruction() {
        for (let CompConstructor of this.getActiveComponents()) {
            var componentData = ComponentUtil.getComponentData(CompConstructor);
            let preDestroyMethod = LifeCycleHooksUtil.getConfig(CompConstructor).preDestroyMethod;
            if (preDestroyMethod) {
                let instance = this.injector.getComponent(componentData.classToken);
                if (!_.isFunction(instance[preDestroyMethod])) {
                    throw new Error(`@PreDestroy is not on a method (${preDestroyMethod})`);
                }
                instance[preDestroyMethod]();
            }
        }
    }

    private getActiveComponents() {
        let activeProfile = this.getActiveProfile();
        return _.filter(this.configurationData.componentFactory.components, (CompConstructor) => {
            let profile = ComponentUtil.getComponentData(CompConstructor).profile;
            if (profile) return profile === activeProfile;
            return true;
        })
    }

    private getActiveProfile():string {
        return this.getConfigurationProperty(ApplicationContext.ACTIVE_PROFILE_PROPERTY_KEY);
    }

    private getConfigurationProperty(propertyKey:string):string {
        return process.env[propertyKey] || this.configurationData.properties.get(propertyKey);
    }
}