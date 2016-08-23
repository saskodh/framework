import { ConfigurationUtil } from "./ConfigurationDecorator";
import { DecoratorBadArgumentError } from "../errors/BadArgumentErrors";
import { DecoratorType, DecoratorUtil } from "../helpers/DecoratorUtils";

/**
 * Decorator used for composing configuration classes by importing other configuration classes.
 *
 * @param configurationClasses varargs configuration classes
 * @returns ClassDecorator for composing configuration classes
 * */
export function Import(...configurationClasses) {
    return function (targetConfigurationClass) {
        DecoratorUtil.throwOnWrongType(Import, DecoratorType.CLASS, [...arguments]);
        ConfigurationUtil.throwWhenNotOnConfigurationClass(Import, [...arguments]);
        let targetConfigurationData = ConfigurationUtil.getConfigurationData(targetConfigurationClass);
        for (let configurationClass of configurationClasses) {
            if (!ConfigurationUtil.isConfigurationClass(configurationClass)) {
                throw new DecoratorBadArgumentError(`${configurationClass.name} is not a configuration class.`,
                    Import, [...arguments]);
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