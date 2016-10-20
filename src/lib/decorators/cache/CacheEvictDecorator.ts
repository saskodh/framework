import { ICacheConfigEvict, CacheDecoratorMetadata } from "./CacheClasses";
import { DecoratorUtil, DecoratorType } from "../../helpers/DecoratorUtils";
import { DecoratorHelper } from "../common/DecoratorHelper";
import * as _ from "lodash";
/**
 *
 * @CacheEvict demarcates methods that perform cache eviction, that is methods that act as triggers for removing
 * data from the cache.
 * @param cacheConfiguration. An object that must contains the cacheName: string, an optional parameter for specifying
 * weather the whole cache should be flushed or just a specific entry, an optional parameter key: string
 */
export function CacheEvict(cacheConfiguration: ICacheConfigEvict) {
    cacheConfiguration.cacheName = _.isUndefined(cacheConfiguration.cacheName) ? '' : cacheConfiguration.cacheName;
    cacheConfiguration.allEntries =
        _.isUndefined(cacheConfiguration.allEntries) ? false : cacheConfiguration.allEntries;
    cacheConfiguration.key = _.isUndefined(cacheConfiguration.key) ? undefined : cacheConfiguration.key;

    return function (target, method) {
        DecoratorUtil.throwOnWrongType(CacheEvict, DecoratorType.METHOD, [...arguments]);

        let cacheEvictDecoratorMetadata = DecoratorHelper.getOwnMetadata(target, CacheEvict,
            new CacheDecoratorMetadata());
        cacheEvictDecoratorMetadata.methods
            .push({ cacheName: cacheConfiguration.cacheName, method: method, allEntries: cacheConfiguration.allEntries,
                key: cacheConfiguration.key });
        DecoratorHelper.setMetadata(target, CacheEvict, cacheEvictDecoratorMetadata);
    };
}
DecoratorHelper.createDecorator(CacheEvict, DecoratorType.METHOD);