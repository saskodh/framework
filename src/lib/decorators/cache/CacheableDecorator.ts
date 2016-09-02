import { DecoratorType, DecoratorUtil } from "../../helpers/DecoratorUtils";
import { ICacheConfigCache, CacheDecoratorMetadata } from "./CacheClasses";
import { DecoratorHelper } from "../common/DecoratorHelper";
import * as _ from "lodash";

/**
 *
 * @Cacheable is used to demarcate methods that are cacheable - that is, methods for whom the result is stored into
 * the cache so on subsequent invocations (with the same arguments), the value in the cache is returned without having
 * to actually execute the method.
 * @param cacheConfiguration. An object that must contains the cacheName: string, an optional parameter key: string
 */
export function Cacheable(cacheConfiguration: ICacheConfigCache) {
    cacheConfiguration.cacheName = _.isUndefined(cacheConfiguration.cacheName) ? '' : cacheConfiguration.cacheName;
    cacheConfiguration.key = _.isUndefined(cacheConfiguration.key) ? undefined : cacheConfiguration.key;

    return function (target, method) {
        DecoratorUtil.throwOnWrongType(Cacheable, DecoratorType.METHOD, [...arguments]);

        let cacheableDecoratorMetadata = DecoratorHelper.getOwnMetadata(target, Cacheable, new CacheDecoratorMetadata(), true);
        cacheableDecoratorMetadata.methods
            .push({ cacheName: cacheConfiguration.cacheName, method: method, key: cacheConfiguration.key });
        DecoratorHelper.setMetadata(target, Cacheable, cacheableDecoratorMetadata);
    };
}
DecoratorHelper.createDecorator(Cacheable, DecoratorType.METHOD);