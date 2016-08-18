import { ComponentFactory } from "../di/ComponentFactory";
import { ComponentScanUtil } from "./ComponentScanDecorator";
import { Component, ComponentUtil } from "./ComponentDecorator";
import { Environment } from "../di/Environment";
import { DecoratorUsageError, DecoratorUsageTypeError } from "../errors/DecoratorUsageErrors";
import { DecoratorUtil, DecoratorType } from "../helpers/DecoratorUtils";

const CONFIGURATION_HOLDER_TOKEN = Symbol('configuration_holder_token');

export class ProfiledPath {
    profiles: Array<string>;
    path: string;

    constructor(profiles: Array<string>, path: string) {
        this.profiles = profiles;
        this.path = path;
    }
}

export class ConfigurationData {

    componentFactory: ComponentFactory;
    componentDefinitionPostProcessorFactory: ComponentFactory;
    componentPostProcessorFactory: ComponentFactory;

    componentScanPaths: Array<ProfiledPath>;
    propertySourcePaths: Array<ProfiledPath>;

    activeProfiles: Array<string>;

    constructor() {
        this.componentFactory = new ComponentFactory();
        this.componentPostProcessorFactory = new ComponentFactory();
        this.componentDefinitionPostProcessorFactory = new ComponentFactory();

        this.componentScanPaths = [];
        this.propertySourcePaths = [];
        this.activeProfiles = [];
    }

    loadAllComponents(environment: Environment) {
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
        DecoratorUtil.throwOnWrongType("@Configuration", DecoratorType.CLASS, Array.prototype.slice.call(arguments));
        if (target[CONFIGURATION_HOLDER_TOKEN]) {
            let subjectName = DecoratorUtil.getSubjectName(Array.prototype.slice.call(arguments));
            throw new DecoratorUsageError(`Duplicate @Configuration decorator' (${subjectName})`);
        }
        Component()(target);
        target[CONFIGURATION_HOLDER_TOKEN] = new ConfigurationData();

        // todo allow registering components in this target class
    };
}

export class ConfigurationUtil {

    static getConfigurationData(target): ConfigurationData {
        if (!this.isConfigurationClass(target)) {
            let subjectName = DecoratorUtil.getSubjectName(Array.prototype.slice.call(arguments));
            throw new Error(`${subjectName} is not a @Configuration class`);
        }
        return target[CONFIGURATION_HOLDER_TOKEN];
    }

    static isConfigurationClass(target): boolean {
        return !!target[CONFIGURATION_HOLDER_TOKEN];
    }

    static addComponentScanPath(target, path: string) {
        this.getConfigurationData(target).componentScanPaths.push(new ProfiledPath(
            ComponentUtil.getComponentData(target).profiles, path));
    }

    static addPropertySourcePath(target, path: string) {
        this.getConfigurationData(target).propertySourcePaths.push(new ProfiledPath(
            ComponentUtil.getComponentData(target).profiles, path));
    }

    static throwWhenNotOnConfigurationClass (decoratorName: string, args: Array<any>, rootCause?: Error) {
        if (!this.isConfigurationClass(args[0])) {
            let subjectName = DecoratorUtil.getSubjectName(args);
                throw new DecoratorUsageTypeError(decoratorName, "@Configuration classes", subjectName, rootCause);
        }
    }
}