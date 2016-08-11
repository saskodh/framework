import { ConfigurationUtil } from "./ConfigurationDecorator";
import { BadArgumentError } from "../errors/BadArgumentError";
import { DecoratorUsageError } from "../errors/DecoratorUsageError";
import { DecoratorUtil } from "../helpers/DecoratorUtils";

/**
 * Decorator used for composing configuration classes by importing other configuration classes.
 *
 * @param configurationClasses varargs configuration classes
 * @returns ClassDecorator for composing configuration classes
 * */
export function Import(...configurationClasses) {
    return function (targetConfigurationClass) {
        if (!ConfigurationUtil.isConfigurationClass(targetConfigurationClass)) {
            let subjectName = DecoratorUtil.getSubjectName(Array.prototype.slice.call(arguments));
            throw new DecoratorUsageError(`@Import is allowed on @Configuration classes only! (${subjectName})`);
        }
        let targetConfigurationData = ConfigurationUtil.getConfigurationData(targetConfigurationClass);
        for (let configurationClass of configurationClasses) {
            if (!ConfigurationUtil.isConfigurationClass(configurationClass)) {
                throw new BadArgumentError(`${configurationClass.name} is not a @Configuration() class`);
            }
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
            for (let componentScanPath of configurationData.componentScanPaths) {
                ConfigurationUtil.addComponentScanPath(targetConfigurationClass, componentScanPath);
            }
            for (let propertySourcePaths of configurationData.propertySourcePaths) {
                ConfigurationUtil.addPropertySourcePath(targetConfigurationClass, propertySourcePaths);
            }
            configurationData.properties.forEach((value, key) => {
                targetConfigurationData.properties.set(key, value);
            });
        }
    };
}