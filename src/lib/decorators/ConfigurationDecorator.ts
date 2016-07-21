import { ComponentFactory } from "../di/ComponentFactory";

export const CONFIGURATION_HOLDER_TOKEN = Symbol('configuration_holder_token');

export class ConfigurationData {

    componentFactory: ComponentFactory;
    componentDefinitionPostProcessorFactory: ComponentFactory;
    componentPostProcessorFactory: ComponentFactory;

    properties: Map<string, string>;

    constructor() {
        this.componentFactory = new ComponentFactory();
        this.componentPostProcessorFactory = new ComponentFactory();
        this.componentDefinitionPostProcessorFactory = new ComponentFactory();

        this.properties = new Map();
    }
}

export function Configuration() {
    return function (target) {
        if (target[CONFIGURATION_HOLDER_TOKEN]) {
            throw 'Duplicate @Configuration decorator';
        }
        target[CONFIGURATION_HOLDER_TOKEN] = new ConfigurationData();

        // todo allow registering components in this target class
    };
}

export class ConfigurationUtil {

    static getConfigurationData(target): ConfigurationData {
        if (!target[CONFIGURATION_HOLDER_TOKEN]) {
            throw new Error('Given target is not a @Configuration class');
        }
        return target[CONFIGURATION_HOLDER_TOKEN];
    }
}