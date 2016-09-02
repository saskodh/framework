import { ICacheConfigCache, CacheDecoratorMetadata } from "./CacheClasses";
import { DecoratorUtil, DecoratorType } from "../../helpers/DecoratorUtils";
import { DecoratorHelper } from "../common/DecoratorHelper";
import * as _ from "lodash";
/**
 *
 * @CachePut is used to demarcate methods that are cacheable - the method will always be executed and its result
 * placed into the cache.
 * @param cacheConfiguration. An object that must contains the cacheName: string, an optional parameter key: string
 */
export function CachePut(cacheConfiguration: ICacheConfigCache) {
    cacheConfiguration.cacheName = _.isUndefined(cacheConfiguration.cacheName) ? '' : cacheConfiguration.cacheName;
    cacheConfiguration.key = _.isUndefined(cacheConfiguration.key) ? undefined : cacheConfiguration.key;

    return function (target, method) {
        DecoratorUtil.throwOnWrongType(CachePut, DecoratorType.METHOD, [...arguments]);

        let cachePutDecoratorMetadata = DecoratorHelper.getOwnMetadata(target, CachePut, new CacheDecoratorMetadata(), true);
        cachePutDecoratorMetadata.methods
            .push({ cacheName: cacheConfiguration.cacheName, method: method, key: cacheConfiguration.key });
        DecoratorHelper.setMetadata(target, CachePut, cachePutDecoratorMetadata);
    };
}
DecoratorHelper.createDecorator(CachePut, DecoratorType.METHOD);