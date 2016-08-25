import {ConfigurationUtil} from "./ConfigurationDecorator";
import {CacheDefinitionPostProcessor} from '../processors/cache/CacheDefinitionPostProcessor';

export function EnableCaching() {
    return function (target) {
        let configurationData = ConfigurationUtil.getConfigurationData(target);
        if (!configurationData) {
            throw '@EnableCaching is allowed on @Configuration classes only!';
        }
        configurationData.componentDefinitionPostProcessorFactory.components
            .push(CacheDefinitionPostProcessor);
    };
}