import { ConfigurationUtil } from "./ConfigurationDecorator";
import { BadArgumentError } from "../errors/BadArgumentError";

/**
 * Decorator used for composing configuration classes by importing other configuration classes.
 *
 * @param configurationClasses varargs configuration classes
 * @returns ClassDecorator for composing configuration classes
 * */
export function Import(...configurationClasses) {
    return function (targetConfigurationClass) {
        ConfigurationUtil.throwWhenNotOnConfigurationClass("@Import", Array.prototype.slice.call(arguments));
        let targetConfigurationData = ConfigurationUtil.getConfigurationData(targetConfigurationClass);
        for (let configurationClass of configurationClasses) {
            if (!ConfigurationUtil.isConfigurationClass(configurationClass)) {
                throw new BadArgumentError(`${configurationClass.name} is not a @Configuration() class`);
            }
            let configurationData = ConfigurationUtil.getConfigurationData(configurationClass);
            targetConfigurationData.componentFactory.components.push(...configurationData.componentFactory.components);
            targetConfigurationData.componentDefinitionPostProcessorFactory.components
                .push(...configurationData.componentDefinitionPostProcessorFactory.components);
            targetConfigurationData.componentPostProcessorFactory.components
                .push(...configurationData.componentPostProcessorFactory.components);
            targetConfigurationData.propertySourcePaths.push(...configurationData.propertySourcePaths);
            targetConfigurationData.componentScanPaths.push(...configurationData.componentScanPaths);
        }
    };
}