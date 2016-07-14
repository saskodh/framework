import {ConfigurationUtil} from "./ConfigurationDecorator";
import {CacheComponentDefinitionPostProcessor} from'../Cache/CacheComponentDefinitionPostProcessor';

export function EnableCaching() {
    return function (target) {
        let configurationData = ConfigurationUtil.getConfigurationData(target);
        if (!configurationData) throw '@EnableCaching is allowed on @Configuration classes only!';

        configurationData.componentFactory.components.push(CacheComponentDefinitionPostProcessor);
    }
}