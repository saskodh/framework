import {ConfigurationUtil, ConfigurationDecoratorMetadata, Configuration} from "../decorators/ConfigurationDecorator";
import { ComponentUtil } from "../decorators/ComponentDecorator";
import { Injector } from "./Injector";
import { Dispatcher } from "../web/Dispatcher";
import { Router } from "express";
import * as _ from "lodash";
import {
    PostConstructDecoratorMetadata,
    PostConstruct, PreDestroyDecoratorMetadata, PreDestroy
} from "../decorators/LifeCycleHooksDecorators";
import { ProcessHandler } from "../helpers/ProcessHandler";
import {
    IComponentPostProcessor, ComponentPostProcessorUtil,
    ComponentPostProcessor
} from "../processors/ComponentPostProcessor";
import {
    IComponentDefinitionPostProcessor, ComponentDefinitionPostProcessorUtil, ComponentDefinitionPostProcessor
} from "../processors/ComponentDefinitionPostProcessor";
import { OrderUtil } from "../decorators/OrderDecorator";
import { Environment } from "./Environment";
import {AspectDefinitionPostProcessor} from "../processors/aspect/AspectDefinitionPostProcessor";
import { DecoratorUsageError } from "../errors/DecoratorUsageErrors";
import { BadArgumentError } from "../errors/BadArgumentErrors";
import {
    ComponentInitializationError, ComponentWiringError,
    PostConstructionError, PreDestructionError, ApplicationContextError, PostProcessError
} from "../errors/ApplicationContextErrors";
import {DynamicDependencyResolver} from "./DynamicDependencyResolver";
import { CacheDefinitionPostProcessor } from "../processors/cache/CacheDefinitionPostProcessor";
import { LoggerFactory } from "../helpers/logging/LoggerFactory";
import {DecoratorHelper} from "../decorators/common/DecoratorHelper";
import {EnableCaching} from "../decorators/cache/EnableCachingDecorator";
import {ComponentScanUtil, ComponentScan, ComponentScanDecoratorMetadata} from "../decorators/ComponentScanDecorator";
import {PropertySource, PropertySourceDecoratorMetadata} from "../decorators/PropertySourceDecorator";
import {
    ActiveProfiles, ActiveProfilesDecoratorMetadata, Profile,
    ProfileDecoratorMetadata
} from "../decorators/ProfileDecorators";
import {Qualifier, QualifierDecoratorMetadata} from "../decorators/QualifierDecorator";
import {Aspect} from "../decorators/aspect/AspectDecorator";
import {
    DynamicInject, DynamicInjectionDataDecoratorMetadata,
    Value, ValueDecoratorMetadata, InjectionDataDecoratorMetadata, Inject
} from "../decorators/InjectionDecorators";
import {Import, ImportDecoratorMetadata} from "../decorators/ImportDecorator";

let logger = LoggerFactory.getInstance();

export class ApplicationContextState {
    static NOT_INITIALIZED = 'NOT_INITIALIZED';
    static INITIALIZING = 'INITIALIZING';
    static READY = 'READY';
}

export class ApplicationContext {

    private state: ApplicationContextState;
    private injector: Injector;
    private dispatcher: Dispatcher;
    private environment: Environment;
    private configurationData: ConfigurationDecoratorMetadata;
    private unRegisterExitListenerCallback: Function;

    private configurationClass;

    constructor(configurationClass) {
        this.state = ApplicationContextState.NOT_INITIALIZED;
        this.configurationClass = configurationClass;
        logger.info('Constructing the application context...');
        this.injector = new Injector();
        this.dispatcher = new Dispatcher();
        this.loadConfigurationClasses(configurationClass);
        this.configurationData = ConfigurationUtil.getConfigurationData(configurationClass);
        this.initializeEnvironment();
        this.loadAllComponents();
    }

    getComponent <T>(componentClass): T {
        this.verifyContextReady();
        if (!ComponentUtil.isComponent(componentClass)) {
            throw new BadArgumentError("Argument is not a component class");
        }
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
            logger.warn("Application context was already initialized or it is initializing at the moment.");
        }
        this.state = ApplicationContextState.INITIALIZING;
        logger.info('Stating the application context...');

        await this.initializeDefinitionPostProcessors();
        await this.initializePostProcessors();

        await this.postProcessDefinition();
        await this.initializeComponents();
        await this.wireComponents();

        await this.postProcessBeforeInit();

        await this.executePostConstruction();
        await this.dispatcher.postConstruct();

        await this.postProcessAfterInit();

        this.state = ApplicationContextState.READY;
    }

    private wireAspectDefinitionPostProcessor() {
        let aspectDefinitionPostProcessor = <AspectDefinitionPostProcessor>
            this.injector.getComponent(ComponentUtil.getClassToken(AspectDefinitionPostProcessor));
        aspectDefinitionPostProcessor.setInjector(this.injector);
        aspectDefinitionPostProcessor.setAspectComponentDefinitions(this.getActiveAspects());
    }

    private wireCacheDefinitionPostProcessor() {
        if (DecoratorHelper.hasMetadata(this.configurationClass, EnableCaching)){
            let cacheDefinitionPostProcessor = <CacheDefinitionPostProcessor>
                this.injector.getComponent(ComponentUtil.getClassToken(CacheDefinitionPostProcessor));
            cacheDefinitionPostProcessor.setInjector(this.injector);
        }
    }

    /**
     * Manually destroys the application context. Running @PreDestroy method on all components.
     */
    async destroy() {
        logger.info('Destroying the application context...');
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
        logger.info(`Initializing ApplicationContext's components...`);
        for (let CompConstructor of this.getActiveComponents()) {
            let componentData = ComponentUtil.getComponentData(CompConstructor);
            logger.debug(`Initializing ${componentData.componentName} component.`);

            let instance;
            try {
                instance = new CompConstructor();
            } catch (err) {
                throw new ComponentInitializationError(`Cannot instantiate component ${CompConstructor.name}.`, err);
            }
            this.injector.register(componentData.classToken, instance);
            for (let token of DecoratorHelper.getMetadataOrDefault(CompConstructor, Qualifier,
                new QualifierDecoratorMetadata()).aliasTokens) {
                this.injector.register(token, instance);
            }
        }
    }

    private wireComponents() {
        logger.info(`Wiring ApplicationContext's components...`);
        for (let CompConstructor of this.getActiveComponents()) {
            let componentData = ComponentUtil.getComponentData(CompConstructor);
            let instance = this.injector.getComponent(componentData.classToken);

            let injectionData = DecoratorHelper.getMetadataOrDefault(CompConstructor, Inject,
                new InjectionDataDecoratorMetadata());
            logger.debug(`Wiring dependencies for '${componentData.componentName}' component.`);
            injectionData.dependencies.forEach((dependencyData, fieldName) => {
                let dependency;
                try {
                    dependency = dependencyData.isArray ? this.injector.getComponents(dependencyData.token) :
                        this.injector.getComponent(dependencyData.token);
                } catch (err) {
                    throw new ComponentWiringError(
                        `Cannot inject dependency into ${CompConstructor.name}.${fieldName}.`, err);
                }
                Reflect.set(instance, fieldName, dependency);
            });
            let dynamicDependencies = DecoratorHelper.getMetadataOrDefault(CompConstructor, DynamicInject,
                new DynamicInjectionDataDecoratorMetadata()).dynamicDependencies;
            logger.debug(`Wiring dynamic dependencies for '${componentData.componentName}' component.`);
            dynamicDependencies.forEach((dependencyData, fieldName) => {
               let dynamicResolver = new DynamicDependencyResolver(this.injector, dependencyData);
                Object.defineProperty(instance, fieldName, dynamicResolver.getPropertyDescriptor());
            });

            let properties = DecoratorHelper.getMetadataOrDefault(CompConstructor, Value,
                new ValueDecoratorMetadata()).properties;
            logger.debug(`Wiring properties for '${componentData.componentName}' component.`);
            properties.forEach((propertyKey, fieldName) => {
                Reflect.set(instance, fieldName, this.environment.getProperty(propertyKey));
            });

            this.dispatcher.processAfterInit(CompConstructor, instance);
        }
    }

    private initializeDefinitionPostProcessors() {
        logger.verbose('Initializing component definition post processors...');
        // NOTE: add custom defined component definition post processors
        this.configurationData.componentDefinitionPostProcessorFactory.components.push(AspectDefinitionPostProcessor);
        if (DecoratorHelper.hasMetadata(this.configurationClass, EnableCaching))
            this.configurationData.componentDefinitionPostProcessorFactory.components.push(CacheDefinitionPostProcessor);

        // NOTE: initialize all component definition post processors
        for (let CompConstructor of this.getActiveDefinitionPostProcessors()) {
            let componentData = ComponentUtil.getComponentData(CompConstructor);
            logger.debug(`Initializing and registering component definition post processor: '${componentData
                .componentName}'`);

            let instance = new CompConstructor();
            if (!ComponentDefinitionPostProcessorUtil.isIComponentDefinitionPostProcessor(instance)) {
                throw new DecoratorUsageError(`${CompConstructor.name} must implement the ` +
                'IComponentDefinitionPostProcessor interface when annotated with @ComponentDefinitionPostProcessor');
            }

            this.injector.register(componentData.classToken, instance);
            for (let token of DecoratorHelper.getMetadataOrDefault(CompConstructor, Qualifier,
                new QualifierDecoratorMetadata()).aliasTokens) {
                this.injector.register(token, instance);
            }
        }
        this.wireAspectDefinitionPostProcessor();
        this.wireCacheDefinitionPostProcessor();
    }

    private initializePostProcessors() {
        logger.verbose('Initializing component post processors...');
        for (let CompConstructor of this.getActivePostProcessors()) {
            let componentData = ComponentUtil.getComponentData(CompConstructor);
            logger.debug(`Initializing and registering component post processor: '${componentData.componentName}'`);

            let instance = new CompConstructor();
            if (!ComponentPostProcessorUtil.isIComponentPostProcessor(instance)) {
                throw new DecoratorUsageError(`${CompConstructor.name} must implement the IComponentPostProcessor ` +
                    'interface when annotated with @ComponentPostProcessor');
            }

            this.injector.register(componentData.classToken, instance);
            for (let token of DecoratorHelper.getMetadataOrDefault(CompConstructor, Qualifier,
                new QualifierDecoratorMetadata()).aliasTokens) {
                this.injector.register(token, instance);
            }
        }
    }

    private async postProcessDefinition() {
        logger.info('Postprocessing component definitions...');
        this.configurationData.componentFactory.components = _.map(
            this.configurationData.componentFactory.components, (componentDefinition) => {
                logger.debug(`Postprocessing component definition for: '${componentDefinition.name}'`);
                for (let componentDefinitionPostProcessor of this.getOrderedDefinitionPostProcessors()) {
                    let result;
                    try {
                        result = componentDefinitionPostProcessor.postProcessDefinition(componentDefinition);
                    } catch (err) {
                        throw new PostProcessError(`postProcessDefinition() from ${componentDefinitionPostProcessor.
                            constructor.name} failed on ${ComponentUtil
                            .getComponentData(componentDefinition).componentName}`, err);
                    }
                    if (_.isFunction(result)) {
                        componentDefinition = result;
                    } else if (!_.isUndefined(result)) {
                        throw new PostProcessError(componentDefinitionPostProcessor.constructor.name +
                            ' (Component Definition Post Processor) must return a constructor function for component ' +
                            ComponentUtil.getComponentData(componentDefinition).componentName);
                    }
                }
                return componentDefinition;
            }
        );
    }

    private async postProcessBeforeInit() {
        logger.info('Postprocessing components before initialization...');
        for (let componentPostProcessor of this.getOrderedPostProcessors()) {

            for (let componentConstructor of this.getActiveComponents()) {
                let componentData = ComponentUtil.getComponentData(componentConstructor);
                logger.debug(`Post processing component '${componentData.componentName}' by 
                    '${componentPostProcessor.name}' component post processor.`);
                let instance = this.injector.getComponent(componentData.classToken);
                try {
                    componentPostProcessor.postProcessBeforeInit(instance);
                } catch (err) {
                    throw new PostProcessError(`postProcessBeforeInit() from ${componentPostProcessor.constructor.name}`
                     + ` failed on ${componentConstructor.constructor.name}`, err);
                }
            }
        }
    }

    private async postProcessAfterInit() {
        logger.info('Postprocessing components after initialization...');
        for (let componentPostProcessor of this.getOrderedPostProcessors()) {

            for (let componentConstructor of this.getActiveComponents()) {
                let componentData = ComponentUtil.getComponentData(componentConstructor);
                logger.debug(`Post processing component '${componentData.componentName}' by 
                    '${componentPostProcessor.name}' component post processor.`);
                let instance = this.injector.getComponent(componentData.classToken);
                try {
                    componentPostProcessor.postProcessAfterInit(instance);
                } catch (err) {
                    throw new PostProcessError(`postProcessAfterInit() from ${componentPostProcessor.
                        constructor.name} failed on ${componentConstructor.name}`, err);
                }
            }
        }
    }

    private async executePostConstruction() {
        logger.info('Executing @PostConstruct methods for all components...');
        for (let CompConstructor of this.getActiveComponents()) {
            let componentData = ComponentUtil.getComponentData(CompConstructor);
            let postConstructMethod = DecoratorHelper.getMetadataOrDefault(CompConstructor, PostConstruct,
                new PostConstructDecoratorMetadata()).postConstructMethod;
            if (postConstructMethod) {
                let instance = this.injector.getComponent(componentData.classToken);
                if (!_.isFunction(instance[postConstructMethod])) {
                    throw new DecoratorUsageError(`@PostConstruct is not on a method (${postConstructMethod})`);
                }
                logger.debug(`Executing @PostConstruct method for '${componentData.componentName}' component.`);
                try {
                    await instance[postConstructMethod]();
                } catch (err) {
                    throw new PostConstructionError(`Could not post-construct component ${CompConstructor.name}.`, err);
                }
            }
        }
    }

    private async executePreDestruction() {
        logger.info('Executing @PreDestroy methods for all components...');
        for (let CompConstructor of this.getActiveComponents()) {
            let componentData = ComponentUtil.getComponentData(CompConstructor);
            let preDestroyMethod = DecoratorHelper.getMetadataOrDefault(CompConstructor, PreDestroy,
                new PreDestroyDecoratorMetadata()).preDestroyMethod;
            if (preDestroyMethod) {
                let instance = this.injector.getComponent(componentData.classToken);
                if (!_.isFunction(instance[preDestroyMethod])) {
                    throw new DecoratorUsageError(`@PreDestroy is not on a method (${preDestroyMethod})`);
                }
                logger.debug(`Executing @PreDestroy method for '${componentData.componentName}' component.`);
                try {
                    await instance[preDestroyMethod]();
                } catch (err) {
                    throw new PreDestructionError(`Could not pre-destroy component ${CompConstructor.name}.`, err);
                }
            }
        }
    }

    private getActiveComponents() {
        return _.filter(this.configurationData.componentFactory.components, (CompConstructor) => {
            let profiles = DecoratorHelper.getMetadataOrDefault(CompConstructor, Profile, new ProfileDecoratorMetadata())
                .profiles;
            if (profiles.length > 0) {
                return this.environment.acceptsProfiles(...profiles);
            }
            return true;
        });
    }

    private getActiveDefinitionPostProcessors() {
        let definitionPostProcessors = _.filter(
            this.configurationData.componentDefinitionPostProcessorFactory.components, (CompConstructor) => {
                let profiles = DecoratorHelper.getMetadataOrDefault(CompConstructor, Profile, new ProfileDecoratorMetadata())
                    .profiles;
                if (profiles.length > 0) {
                    return this.environment.acceptsProfiles(...profiles);
                }
                return true;
            });
        return OrderUtil.orderList(definitionPostProcessors);
    }

    private getActivePostProcessors() {
        let postProcessors = _.filter(
            this.configurationData.componentPostProcessorFactory.components, (CompConstructor) => {
                let profiles = DecoratorHelper.getMetadataOrDefault(CompConstructor, Profile, new ProfileDecoratorMetadata())
                    .profiles;
                if (profiles.length > 0) {
                    return this.environment.acceptsProfiles(...profiles);
                }
                return true;
            });
        return OrderUtil.orderList(postProcessors);
    }

    private getActiveAspects() {
        let aspects =  _.filter(this.configurationData.componentFactory.components, (CompConstructor) => {
            if (!DecoratorHelper.hasMetadata(CompConstructor, Aspect)) {
                return false;
            }
            let profiles = DecoratorHelper.getMetadataOrDefault(CompConstructor, Profile, new ProfileDecoratorMetadata())
                .profiles;
            if (profiles.length > 0) {
                return this.environment.acceptsProfiles(...profiles);
            }
            return true;
        });
        return OrderUtil.orderList(aspects).reverse();
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
        logger.info(`Initializing the ApplicationContext's Environment...`);
        this.environment = new Environment();
        this.environment.setActiveProfiles(...DecoratorHelper.getMetadataOrDefault(this.configurationClass, ActiveProfiles,
            new ActiveProfilesDecoratorMetadata()).activeProfiles);
        this.environment.setApplicationProperties(DecoratorHelper.getMetadataOrDefault(this.configurationClass, PropertySource,
            new PropertySourceDecoratorMetadata()).propertySourcePaths, this.configurationClass);
        this.injector.register(ComponentUtil.getComponentData(Environment).classToken, this.environment);
    }

    private verifyContextReady() {
        if (this.state !== ApplicationContextState.READY) {
            throw new ApplicationContextError
                ('Application context is not yet initialized. Start method needs to be called first.');
        }
    }

    private loadAllComponents() {
        logger.info('Loading components by component scan...');
        let componentScanPaths = DecoratorHelper.getMetadataOrDefault(this.configurationClass, ComponentScan,
            new ComponentScanDecoratorMetadata()).componentScanPaths;

        ComponentScanUtil.getComponentsFromPaths(componentScanPaths, this.environment, this.configurationClass)
            .forEach((component) => {
                if (DecoratorHelper.hasMetadata(component, ComponentDefinitionPostProcessor)) {
                    this.configurationData.componentDefinitionPostProcessorFactory.components.push(component);
                } else if (DecoratorHelper.hasMetadata(component, ComponentPostProcessor)) {
                    this.configurationData.componentPostProcessorFactory.components.push(component);
                } else {
                    this.configurationData.componentFactory.components.push(component);
                }
            });
    }

    private loadConfigurationClasses(targetConfigurationClass) {
        let targetConfigurationDecoratorMetadata = DecoratorHelper.getMetadataOrDefault(targetConfigurationClass, Configuration,
            new ConfigurationDecoratorMetadata());
        let targetPropertySourceDecoratorMetadata = DecoratorHelper.getMetadataOrDefault(targetConfigurationClass,
            PropertySource, new PropertySourceDecoratorMetadata());
        let targetComponentScanDecoratorMetadata = DecoratorHelper.getMetadataOrDefault(targetConfigurationClass,
            ComponentScan, new ComponentScanDecoratorMetadata());
        let configurationClasses = DecoratorHelper.getMetadataOrDefault(targetConfigurationClass, Import,
            new ImportDecoratorMetadata()).configurationClasses;
        for (let configurationClass of configurationClasses) {

            let configurationDecoratorMetadata = DecoratorHelper.getMetadataOrDefault(configurationClass, Configuration,
                new ConfigurationDecoratorMetadata());
            targetConfigurationDecoratorMetadata.componentFactory.components
                .push(...configurationDecoratorMetadata.componentFactory.components);
            targetConfigurationDecoratorMetadata.componentDefinitionPostProcessorFactory.components
                .push(...configurationDecoratorMetadata.componentDefinitionPostProcessorFactory.components);
            targetConfigurationDecoratorMetadata.componentPostProcessorFactory.components
                .push(...configurationDecoratorMetadata.componentPostProcessorFactory.components);
            DecoratorHelper.setMetadata(targetConfigurationClass, Configuration, targetConfigurationDecoratorMetadata);

            let propertySourceDecoratorMetadata = DecoratorHelper.getMetadataOrDefault(configurationClass,
                PropertySource, new PropertySourceDecoratorMetadata());
            targetPropertySourceDecoratorMetadata.propertySourcePaths = targetPropertySourceDecoratorMetadata
                .propertySourcePaths.concat(propertySourceDecoratorMetadata.propertySourcePaths);
            DecoratorHelper.setMetadata(targetConfigurationClass, PropertySource,
                targetPropertySourceDecoratorMetadata);

            let componentScanDecoratorMetadata = DecoratorHelper.getMetadataOrDefault(configurationClass, ComponentScan,
                new ComponentScanDecoratorMetadata());
            targetComponentScanDecoratorMetadata.componentScanPaths = targetComponentScanDecoratorMetadata
                .componentScanPaths.concat(componentScanDecoratorMetadata.componentScanPaths);
            DecoratorHelper.setMetadata(targetConfigurationClass, ComponentScan, targetComponentScanDecoratorMetadata);
        }
    }
}