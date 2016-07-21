import { ConfigurationUtil } from "./ConfigurationDecorator";

/**
 * Decorator used for composing configuration classes by importing other configuration classes.
 *
 * @param configurationClasses varargs configuration classes
 * @returns ClassDecorator for composing configuration classes
 * */
export function Import(...configurationClasses) {
    return function (targetConfigurationClass) {
        let targetConfigurationData = ConfigurationUtil.getConfigurationData(targetConfigurationClass);
        for (let configurationClass of configurationClasses) {
            let configurationData = ConfigurationUtil.getConfigurationData(configurationClass);
            for (let component of configurationData.componentFactory.components) {
                targetConfigurationData.componentFactory.components.push(component);
            }
            for (let component of configurationData.componentDefinitionPostProcessorFactory.components) {
                targetConfigurationData.componentDefinitionPostProcessorFactory.components.push(component);
            }
            for (let component of configurationData.componentPostProcessorFactory.components) {
                targetConfigurationData.componentPostProcessorFactory.components.push(component);
            }
            configurationData.properties.forEach((value, key) => {
                targetConfigurationData.properties.set(key, value);
            });
        }
    };
}