import * as _ from "lodash";

export const CACHE_EVICT_CONFIG = Symbol('cache_evict_config');

export class CacheEvictConfigItem {
    cacheName:string;
    method:string;
    allEntries:boolean;

    constructor(cacheName:string, method:string, allEntries:boolean) {
        this.cacheName = cacheName;
        this.method = method;
        this.allEntries = allEntries;
    }
}

export class CacheEvictConfig {
    methods:Array<CacheEvictConfigItem> = [];
}

export function CacheEvict(name?:string, allEntries?:boolean) {
    name = _.isUndefined(name) ? '' : name;
    allEntries = _.isUndefined(allEntries) ? false : allEntries;

    return function (target, method) {
        if (!target[CACHE_EVICT_CONFIG]) target[CACHE_EVICT_CONFIG] = new CacheEvictConfig();
        target[CACHE_EVICT_CONFIG].methods.push(new CacheEvictConfigItem(name, method, allEntries));
    }
}

export class CacheEvictUtil {

    static getCacheEvictConfig(target):CacheEvictConfig {
        return target.prototype[CACHE_EVICT_CONFIG] || new CacheEvictConfig();
    }
}