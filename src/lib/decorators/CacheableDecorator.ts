import * as _ from "lodash";
import { DecoratorType, DecoratorUtil } from "../helpers/DecoratorUtils";

export const CACHE_CONFIG = Symbol('cache_config');

export class CacheDecoratorType {
    static CACHEABLE = 'cacheable';
    static CACHE_EVICT = 'cacheEvict';
    static CACHE_PUT = 'cachePut';

    static getAllCacheDecoratorTypes (): Array<any> {
        return [this.CACHEABLE, this.CACHE_EVICT, this.CACHE_PUT];
    }
}

export interface CacheConfigItem {
    cacheName: string;
    method: string;
    key?: string;
    allEntries?: boolean;
}

export interface ICacheConfigCacheable {
    cacheName: string;
    key?: string;
}

export interface ICacheConfigCacheEvict {
    cacheName: string;
    key?: string;
    allEntries?: boolean;
}

export class CacheConfig {
    methods: Map<CacheDecoratorType, Array<CacheConfigItem>>;

    constructor() {
        this.methods = new Map();
        this.methods.set(CacheDecoratorType.CACHEABLE, []);
        this.methods.set(CacheDecoratorType.CACHE_EVICT, []);
        this.methods.set(CacheDecoratorType.CACHE_PUT, []);
    }
}

/**
 *
 * @Cacheable is used to demarcate methods that are cacheable - that is, methods for whom the result is stored into
 * the cache so on subsequent invocations (with the same arguments), the value in the cache is returned without having
 * to actually execute the method.
 * @param cacheConfiguration. An object that must contains the cacheName: string, an optional parameter key: string
 */
export function Cacheable(cacheConfiguration: ICacheConfigCacheable) {
    cacheConfiguration.cacheName = _.isUndefined(cacheConfiguration.cacheName) ? '' : cacheConfiguration.cacheName;
    cacheConfiguration.key = _.isUndefined(cacheConfiguration.key) ? undefined : cacheConfiguration.key;

    return function (target, method) {
        DecoratorUtil.throwOnWrongType(Cacheable, DecoratorType.METHOD, [...arguments]);

        let cacheConfig = CacheUtil.initCacheConfigIfDoesntExist(target);
        cacheConfig.methods.get(CacheDecoratorType.CACHEABLE)
            .push({ cacheName: cacheConfiguration.cacheName, method: method, key: cacheConfiguration.key });
    };
}

/**
 *
 * @CacheEvict demarcates methods that perform cache eviction, that is methods that act as triggers for removing
 * data from the cache.
 * @param cacheConfiguration. An object that must contains the cacheName: string, an optional parameter for specifying
 * weather the whole cache should be flushed or just a specific entry, an optional parameter key: string
 */
export function CacheEvict(cacheConfiguration: ICacheConfigCacheEvict) {
    cacheConfiguration.cacheName = _.isUndefined(cacheConfiguration.cacheName) ? '' : cacheConfiguration.cacheName;
    cacheConfiguration.allEntries =
        _.isUndefined(cacheConfiguration.allEntries) ? false : cacheConfiguration.allEntries;
    cacheConfiguration.key = _.isUndefined(cacheConfiguration.key) ? undefined : cacheConfiguration.key;

    return function (target, method) {
        DecoratorUtil.throwOnWrongType(CacheEvict, DecoratorType.METHOD, [...arguments]);

        let cacheConfig = CacheUtil.initCacheConfigIfDoesntExist(target);
        cacheConfig.methods.get(CacheDecoratorType.CACHE_EVICT)
            .push({ cacheName: cacheConfiguration.cacheName, method: method, allEntries: cacheConfiguration.allEntries,
                key: cacheConfiguration.key });
    };
}

/**
 *
 * @CachePut is used to demarcate methods that are cacheable - the method will always be executed and its result
 * placed into the cache.
 * @param cacheConfiguration. An object that must contains the cacheName: string, an optional parameter key: string
 */
export function CachePut(cacheConfiguration: ICacheConfigCacheable) {
    cacheConfiguration.cacheName = _.isUndefined(cacheConfiguration.cacheName) ? '' : cacheConfiguration.cacheName;
    cacheConfiguration.key = _.isUndefined(cacheConfiguration.key) ? undefined : cacheConfiguration.key;

    return function (target, method) {
        DecoratorUtil.throwOnWrongType(CachePut, DecoratorType.METHOD, [...arguments]);

        let cacheConfig = CacheUtil.initCacheConfigIfDoesntExist(target);
        cacheConfig.methods.get(CacheDecoratorType.CACHE_PUT)
            .push({ cacheName: cacheConfiguration.cacheName, method: method, key: cacheConfiguration.key });
    };
}

export class CacheUtil {

    static initCacheConfigIfDoesntExist(target): CacheConfig {
        if (_.isUndefined(target[CACHE_CONFIG])) {
            target[CACHE_CONFIG] = new CacheConfig();
        }
        return target[CACHE_CONFIG];
    }

    static getCacheConfig(target): CacheConfig {
        return target[CACHE_CONFIG];
    }

    static getCacheTypeConfig(target, cacheDecoratorType: CacheDecoratorType): Array<CacheConfigItem> {
        if (this.getCacheConfig(target) === undefined) {
            return [];
        }
        return this.getCacheConfig(target).methods.get(cacheDecoratorType);
    }
}