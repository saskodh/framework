import { ComponentFactory } from "../di/ComponentFactory";
import { GeneralUtils } from "../helpers/GeneralUtils";
import * as _ from "lodash";

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
        if (!target[CONFIGURATION_HOLDER_TOKEN]) {
            throw new Error('Given target is not a @Configuration class');
        }
        return target[CONFIGURATION_HOLDER_TOKEN];
    }

    static addComponentScanPath(target, path: string) {
        this.getConfigurationData(target).componentScanPaths.push(path);
    }

    static addPropertySourcePath(target, path: string) {
        this.getConfigurationData(target).propertySourcePaths.push(path);
    }

    static setPropertiesFromPath(configurationData: ConfigurationData) {
        for (let path of configurationData.propertySourcePaths) {
            let properties;
            try {
                properties = require(path);
            }
            catch (error) {
                console.error(`Error occurred while trying to get properties out of @PropertySource() path (${path}).` +
                    ' Error is rethrown.');
                throw error;
            }
            console.log(`Loading properties by @PropertySource from ${path}`);
            this.parseProperties(properties).forEach((value, prop) => configurationData.properties.set(prop, value));
        }
    }

    private static parseProperties(properties): Map<string, string> {
        if (_.isObject(properties)) {
            return GeneralUtils.flattenObject(properties);
        }
        return new Map();
    }
}