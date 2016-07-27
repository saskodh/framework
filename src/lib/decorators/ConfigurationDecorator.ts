import { ComponentFactory } from "../di/ComponentFactory";
import { PropertySourceUtil } from "./PropertySourceDecorator";
import { ComponentScanUtil } from "./ComponentScanDecorator";
import { ComponentUtil } from "./ComponentDecorator";

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
        ComponentScanUtil.getComponentsFromPaths(this.componentScanPaths)
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
        if (target[CONFIGURATION_HOLDER_TOKEN]) {
            throw new Error('Duplicate @Configuration decorator');
        }
        target[CONFIGURATION_HOLDER_TOKEN] = new ConfigurationData();

        // todo allow registering components in this target class
    };
}

export class ConfigurationUtil {

    static getConfigurationData(target): ConfigurationData {
        if (!this.isConfigurationClass(target)) {
            throw new Error('Given target is not a @Configuration class');
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