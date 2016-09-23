import {ConfigurationUtil} from "../ConfigurationDecorator";
import { DecoratorType, DecoratorUtil } from "../../helpers/DecoratorUtils";
import {StandaloneDecoratorMetadata} from "../common/DecoratorMetadata";
import {DecoratorHelper} from "../common/DecoratorHelper";

/**
 *
 * A decorator which enables the caching decorators (@Cacheable, @CacheEvict, @CachePut)
 * May only be put on @Configuration() classes.
 */
export function EnableCaching() {
    return function (target) {
        DecoratorUtil.throwOnWrongType(EnableCaching, DecoratorType.CLASS, [...arguments]);
        ConfigurationUtil.throwWhenNotOnConfigurationClass(EnableCaching, [...arguments]);

        DecoratorHelper.setMetadata(target, EnableCaching, new EnableCacheDecoratorMetadata());
    };
}
DecoratorHelper.createDecorator(EnableCaching, DecoratorType.CLASS);

export class EnableCacheDecoratorMetadata extends StandaloneDecoratorMetadata<EnableCacheDecoratorMetadata> {

}