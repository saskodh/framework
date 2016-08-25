import * as _ from "lodash";

export const CACHE_CONFIG = Symbol('cache_config');

export class CacheDecoratorType {
    static CACHEABLE = 'cacheable';
    static CACHE_EVICT = 'cacheEvict';

    static getAllCacheDecoratorTypes (): Array<any> {
        return [this.CACHEABLE, this.CACHE_EVICT];
    }
}

export interface CacheConfigItem {
    cacheName: string;
    method: string;
    allEntries?: boolean;
}

export class CacheConfig {
    methods: Map<CacheDecoratorType, Array<CacheConfigItem>>;

    constructor() {
        this.methods = new Map();
        this.methods.set(CacheDecoratorType.CACHEABLE, []);
        this.methods.set(CacheDecoratorType.CACHE_EVICT, []);
    }
}

export function Cacheable(name ? : string) {
    name = _.isUndefined(name) ? '' : name;

    return function (target, method) {
        let cacheConfig = CacheUtil.initCacheConfigIfDoesntExist(target);
        cacheConfig.methods.get(CacheDecoratorType.CACHEABLE)
            .push({ cacheName: name, method: method });
    };
}

export function CacheEvict(name ? : string, allEntries ? : boolean) {
    name = _.isUndefined(name) ? '' : name;
    allEntries = _.isUndefined(allEntries) ? false : allEntries;

    return function (target, method) {
        let cacheConfig = CacheUtil.initCacheConfigIfDoesntExist(target);
        cacheConfig.methods.get(CacheDecoratorType.CACHE_EVICT)
            .push({ cacheName: name, method: method, allEntries: allEntries });
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