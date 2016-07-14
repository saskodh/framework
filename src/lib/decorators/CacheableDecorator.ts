import * as _ from "lodash";

export const CACHE_CONFIG = Symbol('cache_config');

export class CacheConfigItem {
    cacheName:string;
    method:string;

    constructor(cacheName:string, method:string) {
        this.cacheName = cacheName;
        this.method = method;
    }
}

export class CacheConfig {
    methods:Array<CacheConfigItem> = [];
}

export function Cacheable(name?:string) {
    name = _.isUndefined(name) ? '' : name;

    return function (target, method) {
        if (!target[CACHE_CONFIG]) target[CACHE_CONFIG] = new CacheConfig();
        target[CACHE_CONFIG].methods.push(new CacheConfigItem(name, method));
    }
}

export class CacheUtil {

    static getCacheConfig(target):CacheConfig {
        return target.prototype[CACHE_CONFIG] || new CacheConfig();
    }
}