import * as hash from "object-hash";
import { ComponentDefinitionPostProcessor } from "../CacheDefinitionPostProcessor";
import { ProxyUtils } from "../../helpers/ProxyUtils";
import { CacheUtil, CacheDecoratorType, CacheConfigItem } from "../../decorators/CacheableDecorator";
import { Injector } from "../../di/Injector";
import { ICacheProvider, I_CACHE_PROVIDER_TOKEN } from "./ICacheProvider";

@ComponentDefinitionPostProcessor()
export class CacheDefinitionPostProcessor {

    private cacheProvider: ICacheProvider;
    private injector: Injector;
    private cacheProxyMethods: Map<string, any>;

    constructor() {
        this.initialize();
    }

    setInjector(injector: Injector) {
        this.injector = injector;
    }

    private initialize() {
        this.cacheProxyMethods = new Map();
        this.cacheProxyMethods.set(CacheDecoratorType.CACHEABLE, this.createCacheableProxyMethod);
        this.cacheProxyMethods.set(CacheDecoratorType.CACHE_EVICT, this.createCacheEvictProxyMethod);
    }

    postProcessDefinition(componentConstructor: FunctionConstructor): any {

        class CacheProxy extends componentConstructor {}

        for (let cacheDecoratorType of CacheDecoratorType.getAllCacheDecoratorTypes()) {
            let cacheConfigArray = CacheUtil.getCacheTypeConfig(CacheProxy.prototype, cacheDecoratorType);
            for (let cacheConfig of cacheConfigArray) {
                let originalMethod = CacheProxy.prototype[cacheConfig.method];
                let proxiedMethod = this.cacheProxyMethods.get(cacheDecoratorType)
                    .apply(this, [originalMethod, cacheConfig]);
                Reflect.set(CacheProxy.prototype, cacheConfig.method, proxiedMethod);
            }
        }
        return CacheProxy;
    }

    private createCacheableProxyMethod(originalMethod, cacheConfigItem: CacheConfigItem) {
        return ProxyUtils.createMethodProxy(originalMethod, async(methodRef, thisArg, args) => {
            let hash = this.createHash(args);

            this.cacheProvider = <ICacheProvider> this.injector.getComponent(I_CACHE_PROVIDER_TOKEN);
            let result = await this.cacheProvider.get(hash, cacheConfigItem.cacheName);
            if (result === null) {
                result = await Reflect.apply(methodRef, thisArg, args);
                await this.cacheProvider.set(hash, result, cacheConfigItem.cacheName);
                return result;
            } else {
                return result;
            }
        });
    }

    private createCacheEvictProxyMethod(originalMethod, cacheConfigItem: CacheConfigItem) {
        if (cacheConfigItem.allEntries) {
            return this.createCacheEvictAllEntriesProxyMethod(originalMethod, cacheConfigItem.cacheName);
        } else {
            return this.createCacheEvictSingleEntryProxyMethod(originalMethod, cacheConfigItem.cacheName);
        }
    }

    private createCacheEvictAllEntriesProxyMethod(originalMethod, cacheName) {
        return ProxyUtils.createMethodProxy(originalMethod, async(methodRef, thisArg, args) => {
            this.cacheProvider = <ICacheProvider> this.injector.getComponent(I_CACHE_PROVIDER_TOKEN);
            this.cacheProvider.flushdb(cacheName);
            return await Reflect.apply(methodRef, thisArg, args);
        });
    }

    private createCacheEvictSingleEntryProxyMethod(originalMethod, cacheName) {
        return ProxyUtils.createMethodProxy(originalMethod, async(methodRef, thisArg, args) => {
            let hash = this.createHash(args);
            this.cacheProvider = <ICacheProvider> this.injector.getComponent(I_CACHE_PROVIDER_TOKEN);
            this.cacheProvider.del(hash, cacheName);
            return await Reflect.apply(methodRef, thisArg, args);
        });
    }

    private createHash(args) {
        return hash(args);
    }
}