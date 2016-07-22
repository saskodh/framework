import { ConfigurationUtil } from "./ConfigurationDecorator";

/**
 * A decorator for defining a JSON property source for the configuration properties.
 * May only be put on @Configuration() classes.
 * @param path to the property source. (For relative paths use __dirname)
 * @returns {(target:any)=>undefined} nothing
 * @constructor
 */
export function PropertySource(path: string) {
    return function (target) {
        ConfigurationUtil.addPropertySourcePath(target, path);
    };
}