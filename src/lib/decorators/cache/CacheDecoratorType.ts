import { Cacheable } from "./CacheableDecorator";
import { CacheEvict } from "./CacheEvictDecorator";
import { CachePut } from "./CachePutDecorator";

export class CacheDecoratorType {
    static CACHEABLE: ICacheInfo = { cacheTypeName: 'cacheable', cacheDecorator: Cacheable };
    static CACHE_EVICT: ICacheInfo = { cacheTypeName: 'cacheEvict', cacheDecorator: CacheEvict };
    static CACHE_PUT: ICacheInfo = { cacheTypeName: 'cachePut', cacheDecorator: CachePut };

    static getAllCacheDecoratorTypes (): Array<ICacheInfo> {
        return [this.CACHEABLE, this.CACHE_EVICT, this.CACHE_PUT];
    }
}

export interface ICacheInfo {
    cacheTypeName;
    cacheDecorator;
}