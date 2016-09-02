import { ComponentFactory } from "../di/ComponentFactory";
import { ComponentScanUtil } from "./ComponentScanDecorator";
import { Component, ComponentUtil } from "./ComponentDecorator";
import { Environment } from "../di/Environment";
import { DecoratorUsageError, DecoratorUsageTypeError } from "../errors/DecoratorUsageErrors";
import { DecoratorUtil, DecoratorType } from "../helpers/DecoratorUtils";
import { LoggerFactory } from "../helpers/logging/LoggerFactory";
import { DecoratorMetadata } from "./common/DecoratorMetadata";
import { DecoratorHelper } from "./common/DecoratorHelper";

let logger = LoggerFactory.getInstance();

export class ProfiledPath {
    profiles: Array<string>;
    path: string;

    constructor(profiles: Array<string>, path: string) {
        this.profiles = profiles;
        this.path = path;
    }
}

export class ConfigurationDecoratorMetadata extends DecoratorMetadata<ConfigurationDecoratorMetadata> {

    componentFactory: ComponentFactory;
    componentDefinitionPostProcessorFactory: ComponentFactory;
    componentPostProcessorFactory: ComponentFactory;

    componentScanPaths: Array<ProfiledPath>;
    propertySourcePaths: Array<ProfiledPath>;

    activeProfiles: Array<string>;

    constructor() {
        super();
        this.componentFactory = new ComponentFactory();
        this.componentPostProcessorFactory = new ComponentFactory();
        this.componentDefinitionPostProcessorFactory = new ComponentFactory();

        this.componentScanPaths = [];
        this.propertySourcePaths = [];
        this.activeProfiles = [];
    }

    mergeMetadata(decoratorMetadata: ConfigurationDecoratorMetadata) {
        this.componentFactory.mergeComponentFactory(decoratorMetadata.componentFactory);
        this.componentDefinitionPostProcessorFactory
            .mergeComponentFactory(decoratorMetadata.componentDefinitionPostProcessorFactory);
        this.componentPostProcessorFactory.mergeComponentFactory(decoratorMetadata.componentPostProcessorFactory);

        this.componentScanPaths = this.componentScanPaths.concat(decoratorMetadata.componentScanPaths);
        this.propertySourcePaths = this.propertySourcePaths.concat(decoratorMetadata.propertySourcePaths);
        this.activeProfiles = this.activeProfiles.concat(decoratorMetadata.activeProfiles);
    }

    loadAllComponents(environment: Environment) {
    logger.info('Loading components by component scan...');
    ComponentScanUtil.getComponentsFromPaths(this.componentScanPaths, environment)
        .forEach((component) => {
            if (ComponentUtil.isComponentDefinitionPostProcessor(component)) {
                this.componentDefinitionPostProcessorFactory.components.push(component);
            } else if (ComponentUtil.isComponentPostProcessor(component)) {
                this.componentPostProcessorFactory.components.push(component);
            } else {
                this.componentFactory.components.push(component);
            }
        });
    }
}

export function Configuration() {
    return function (target) {
        DecoratorUtil.throwOnWrongType(Configuration, DecoratorType.CLASS, [...arguments]);
        if (DecoratorHelper.getOwnMetadata(target, Configuration)) {
            let subjectName = DecoratorUtil.getSubjectName([...arguments]);
            throw new DecoratorUsageError(`Duplicate @Configuration decorator' (${subjectName})`);
        }
        Component()(target);
        DecoratorHelper.setMetadata(target, Configuration, new ConfigurationDecoratorMetadata());
    };
}
DecoratorHelper.createDecorator(Configuration, DecoratorType.CLASS);

export class ConfigurationUtil {

    static getConfigurationData(target): ConfigurationDecoratorMetadata {
        if (!DecoratorHelper.hasMetadata(target, Configuration)) {
            let subjectName = DecoratorUtil.getSubjectName([...arguments]);
            throw new Error(`${subjectName} is not a @Configuration class`);
        }
        return <ConfigurationDecoratorMetadata> DecoratorHelper.getMetadata(target, Configuration);
    }

    static isConfigurationClass(target): boolean {
        return !!DecoratorHelper.hasMetadata(target, Configuration);
    }

    static addComponentScanPath(target, path: string) {
        let configurationData = this.getConfigurationData(target);
        configurationData.componentScanPaths.push(new ProfiledPath(ComponentUtil.getComponentData(target).profiles, path));
        DecoratorHelper.setMetadata(target, Configuration, configurationData);
    }

    static addPropertySourcePath(target, path: string) {
        let configurationData = this.getConfigurationData(target);
        configurationData.propertySourcePaths.push(new ProfiledPath(ComponentUtil.getComponentData(target).profiles, path));
        DecoratorHelper.setMetadata(target, Configuration, configurationData);
    }

    static throwWhenNotOnConfigurationClass (decorator: Function, decoratorArgs: Array<any>, rootCause?: Error) {
        if (!this.isConfigurationClass(decoratorArgs[0])) {
            let subjectName = DecoratorUtil.getSubjectName(decoratorArgs);
                throw new DecoratorUsageTypeError(decorator, `@${Configuration.name} classes`,
                    subjectName, rootCause);
        }
    }
}