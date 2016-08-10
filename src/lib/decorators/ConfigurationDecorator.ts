import { ComponentFactory } from "../di/ComponentFactory";
import { PropertySourceUtil } from "./PropertySourceDecorator";
import { ComponentScanUtil } from "./ComponentScanDecorator";
import { DecoratorUsageError } from "../errors/DecoratorUsageError";

const CONFIGURATION_HOLDER_TOKEN = Symbol('configuration_holder_token');

export class ConfigurationData {

    componentFactory: ComponentFactory;
    componentDefinitionPostProcessorFactory: ComponentFactory;
    componentPostProcessorFactory: ComponentFactory;

    componentScanPaths: Array<string>;
    propertySourcePaths: Array<string>;

    properties: Map<string, string>;

    constructor() {
        this.componentFactory = new ComponentFactory();
        this.componentPostProcessorFactory = new ComponentFactory();
        this.componentDefinitionPostProcessorFactory = new ComponentFactory();

        this.properties = new Map();
        this.componentScanPaths = [];
        this.propertySourcePaths = [];
    }

    loadAllProperties() {
        PropertySourceUtil.getPropertiesFromPaths(...this.propertySourcePaths)
            .forEach((value, prop) => this.properties.set(prop, value));
    }

    loadAllComponents() {
        ComponentScanUtil.loadAllComponents(this);
    }
}

export function Configuration() {
    return function (target) {
        if (target[CONFIGURATION_HOLDER_TOKEN]) {
            throw new DecoratorUsageError(`Duplicate @Configuration decorator' (${target.name})`);
        }
        target[CONFIGURATION_HOLDER_TOKEN] = new ConfigurationData();

        // todo allow registering components in this target class
    };
}

export class ConfigurationUtil {

    static getConfigurationData(target): ConfigurationData {
        if (!this.isConfigurationClass(target)) {
            throw new Error(`${target.name} is not a @Configuration class`);
        }
        return target[CONFIGURATION_HOLDER_TOKEN];
    }

    static isConfigurationClass(target): boolean {
        return !!target[CONFIGURATION_HOLDER_TOKEN];
    }

    static addComponentScanPath(target, path: string) {
        this.getConfigurationData(target).componentScanPaths.push(path);
    }

    static addPropertySourcePath(target, path: string) {
        this.getConfigurationData(target).propertySourcePaths.push(path);
    }
}