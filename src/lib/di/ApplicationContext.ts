import {ConfigurationUtil, ConfigurationData} from "../decorators/ConfigurationDecorator";
import {ComponentUtil} from "../decorators/ComponentDecorator";
import {Injector} from "./Injector";
import {AsyncEngineComponentDefinitionPostProcessor} from "../processors/impl/AsyncEngineComponentDefinitionPostProcessor";
import {Dispatcher} from "../dispatcher/Dispatcher";
import {Router} from "express";
import * as _ from "lodash";

export class ApplicationContext {

    private static ACTIVE_PROFILE_PROPERTY_KEY = 'application.profiles.active';

    private injector: Injector;
    private dispatcher: Dispatcher;

    constructor(configurationClass) {
        this.injector = new Injector();
        this.dispatcher = new Dispatcher();

        let configurationData = ConfigurationUtil.getConfigurationData(configurationClass);
        this.initializeComponents(configurationData);
        this.wireComponents(configurationData);
    }

    getComponent <T> (componentClass): T {
        return <T> this.injector.getComponent(ComponentUtil.getClassToken(componentClass));
    }

    getComponentWithToken <T> (token: Symbol): T {
        return <T> this.injector.getComponent(token);
    }

    getComponents <T> (componentClass): Array<T> {
        return <Array<T>> this.injector.getComponents(ComponentUtil.getAliasToken(componentClass));
    }

    getComponentsWithToken <T> (token: Symbol): Array<T> {
        return <Array<T>> this.injector.getComponents(token);
    }

    getRouter(): Router {
        return this.dispatcher.getRouter();
    }

    private initializeComponents (configurationData: ConfigurationData) {
        var asyncEngine = AsyncEngineComponentDefinitionPostProcessor.getInstance();
        for (let CompConstructor of this.getActiveComponents(configurationData)) {
            var componentData = ComponentUtil.getComponentData(CompConstructor);

            // todo pass the comp constructor through the registered definition post processors
            // configurationData.componentDefinitionPostProcessorFactory

            var PostProcessedComponentConstructor = asyncEngine.postProcessDefinition(CompConstructor);

            let instance = new PostProcessedComponentConstructor();
            this.injector.register(componentData.classToken, instance);
            if (componentData.aliasToken) {
                this.injector.register(componentData.aliasToken, instance);
            }
        }
    }

    private wireComponents (configurationData: ConfigurationData) {
        for (let CompConstructor of this.getActiveComponents(configurationData)) {
            var componentData = ComponentUtil.getComponentData(CompConstructor);
            let injectionData = ComponentUtil.getInjectionData(CompConstructor);
            
            var instances = this.injector.getComponents(componentData.classToken);
            for (let instance of instances) {
                injectionData.dependencies.forEach((dependencyData, fieldName) => {
                    let dependency = dependencyData.isArray ? this.injector.getComponents(dependencyData.token) :
                        this.injector.getComponent(dependencyData.token);
                    Reflect.set(instance, fieldName, dependency);
                });
                injectionData.properties.forEach((propertyKey, fieldName) => {
                    Reflect.set(instance, fieldName, this.getConfigurationProperty(configurationData, propertyKey));
                });

                this.dispatcher.processAfterInit(CompConstructor, instance);

                // todo pass through the post processors configurationData.componentPostProcessorFactory
            }
        }
    }

    private getActiveComponents (configurationData: ConfigurationData) {
        let activeProfile = this.getActiveProfile(configurationData);
        return _.filter(configurationData.componentFactory.components, (CompConstructor) => {
            let profile = ComponentUtil.getComponentData(CompConstructor).profile;
            if (profile) return profile === activeProfile;
            return true;
        })
    }

    private getActiveProfile (configurationData: ConfigurationData): string {
        return this.getConfigurationProperty(configurationData, ApplicationContext.ACTIVE_PROFILE_PROPERTY_KEY);
    }

    private getConfigurationProperty (configurationData: ConfigurationData, propertyKey: string): string {
        return process.env[propertyKey] || configurationData.properties.get(propertyKey);
    }
}