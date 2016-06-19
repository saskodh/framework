import {ConfigurationUtil} from "./ConfigurationDecorator";
import * as _ from "lodash";
import {GeneralUtils} from "../helpers/GeneralUtils";

function parseProperties (properties): Map<string, string> {
    if (_.isObject(properties)) {
        return GeneralUtils.flattenObject(properties);
    }
    return new Map();
}

export function PropertySource (properties) {
    return function (target) {
        var configurationData = ConfigurationUtil.getConfigurationData(target);
        parseProperties(properties).forEach((value, prop) => configurationData.properties.set(prop, value));
    }
}