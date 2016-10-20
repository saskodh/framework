import * as _ from "lodash";
import {ConfigurationUtil} from "./ConfigurationDecorator";
import { GeneralUtils } from "../helpers/GeneralUtils";
import {RequireUtils} from "../helpers/RequireUtils";
import { DecoratorType, DecoratorUtil } from "../helpers/DecoratorUtils";
import { BadArgumentError } from "../errors/BadArgumentErrors";
import { LoggerFactory } from "../helpers/logging/LoggerFactory";
import {DecoratorMetadata} from "./common/DecoratorMetadata";
import {DecoratorHelper} from "./common/DecoratorHelper";

let logger = LoggerFactory.getInstance();

export class PropertySourceDecoratorMetadata extends DecoratorMetadata<PropertySourceDecoratorMetadata> {
    propertySourcePaths: Array<string>;

    constructor() {
        super();
        this.propertySourcePaths = [];
    }

    mergeMetadata(decoratorMetadata: PropertySourceDecoratorMetadata) {
        this.propertySourcePaths.concat(decoratorMetadata.propertySourcePaths);
    }
}

/**
 * A decorator for defining a JSON property source for the configuration properties.
 * May only be put on @Configuration() classes.
 * @param path to the property source. (For relative paths use __dirname)
 */
export function PropertySource(path: string) {
    return function (target) {
        DecoratorUtil.throwOnWrongType(PropertySource, DecoratorType.CLASS, [...arguments]);
        ConfigurationUtil.throwWhenNotOnConfigurationClass(PropertySource, [...arguments]);

        let propertySourceDecoratorMetadata = DecoratorHelper.getOwnMetadata(target, PropertySource,
            new PropertySourceDecoratorMetadata());
        propertySourceDecoratorMetadata.propertySourcePaths.push(path);
        DecoratorHelper.setMetadata(target, PropertySource, propertySourceDecoratorMetadata);
    };
}
DecoratorHelper.createDecorator(PropertySource, DecoratorType.CLASS);

export class PropertySourceUtil {

    static getPropertiesFromPaths(...propertySourcePaths: Array<string>): Map<string, string> {
        let resultPropertiesMap = new Map<string, string>();
        for (let path of propertySourcePaths) {
            logger.debug(`Loading properties by @PropertySource from "${path}"`);
            let properties;
            try {
                properties = RequireUtils.require(path);
            } catch (err) {
                throw new BadArgumentError(`couldn't read property source at ${path}`, err);
            }
            this.parseProperties(properties).forEach((value, prop) => resultPropertiesMap.set(prop, value));
        }
        return resultPropertiesMap;
    }

    private static parseProperties(properties): Map<string, string> {
        if (_.isObject(properties)) {
            return GeneralUtils.flattenObject(properties);
        }
        return new Map();
    }
}