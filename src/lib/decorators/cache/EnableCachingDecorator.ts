import {ConfigurationUtil} from "../ConfigurationDecorator";
import {CacheDefinitionPostProcessor} from '../../processors/cache/CacheDefinitionPostProcessor';
import { DecoratorType, DecoratorUtil } from "../../helpers/DecoratorUtils";

/**
 *
 * A decorator which enables the caching decorators (@Cacheable, @CacheEvict, @CachePut)
 * May only be put on @Configuration() classes.
 */
export function EnableCaching() {
    return function (target) {
        DecoratorUtil.throwOnWrongType(EnableCaching, DecoratorType.CLASS, [...arguments]);
        ConfigurationUtil.throwWhenNotOnConfigurationClass(EnableCaching, [...arguments]);

        ConfigurationUtil.getConfigurationData(target).componentDefinitionPostProcessorFactory.components
            .push(CacheDefinitionPostProcessor);
    };
}