import {ProxyUtils} from "../helpers/ProxyUtils";
import {CacheUtil} from "../decorators/CacheableDecorator";
import {I_CACHE_PROVIDER_TOKEN, ICacheProvider} from "./ICacheProvider";
import {Inject} from "../decorators/InjectionDecorators";
import {Component} from "../decorators/ComponentDecorator";
import {CacheEvictUtil, CacheEvictConfigItem} from "../decorators/CacheEvictDecorator";
import * as hash from "object-hash";

export const CACHE_COMPONENT_DEFINITION_POST_PROCESSOR = Symbol('cache_component_definition_post_processor');

@Component(CACHE_COMPONENT_DEFINITION_POST_PROCESSOR)
export class CacheComponentDefinitionPostProcessor {

    @Inject(I_CACHE_PROVIDER_TOKEN)
    private cacheProvider:ICacheProvider;

    postProcessDefinition(componentConstructor) {
        this.registerCache(componentConstructor);
        this.registerCacheEvict(componentConstructor);
    }

    private registerCache(componentConstructor) {
        let cacheConfig = CacheUtil.getCacheConfig(componentConstructor);
        for (let method of cacheConfig.methods) {
            let originalMethod = componentConstructor.prototype[method.method];
            var proxiedMethod = this.createCachingProxyMethod(originalMethod, method.cacheName);
            Reflect.set(componentConstructor.prototype, method.method, proxiedMethod);
        }
    }

    private createCachingProxyMethod(originalMethod, cacheName) {
        return ProxyUtils.createMethodProxy(originalMethod, async(methodRef, thisArg, args) => {
            let hash = this.createHash(args);

            let result = await this.cacheProvider.get(hash, cacheName);
            if (result === null) {
                result = await Reflect.apply(methodRef, thisArg, args);
                await this.cacheProvider.set(hash, result, cacheName);
                return result;
            } else {
                return result;
            }
        });
    }

    private registerCacheEvict(componentConstructor) {
        let cacheEvictConfig = CacheEvictUtil.getCacheEvictConfig(componentConstructor);
        for (let method of cacheEvictConfig.methods) {
            let originalMethod = componentConstructor.prototype[method.method];
            let proxiedMethod = this.createCacheEvictProxyMethod(originalMethod, method);
            Reflect.set(componentConstructor.prototype, method.method, proxiedMethod);
        }
    }

    private createCacheEvictProxyMethod(originalMethod, method:CacheEvictConfigItem) {
        if (method.allEntries) {
            return this.createCacheEvictAllEntriesProxyMethod(originalMethod, method.cacheName);
        } else {
            return this.createCacheEvictSingleEntryProxyMethod(originalMethod, method.cacheName);
        }
    }

    private createCacheEvictAllEntriesProxyMethod(originalMethod, cacheName) {
        return ProxyUtils.createMethodProxy(originalMethod, async(methodRef, thisArg, args) => {
            this.cacheProvider.flushdb(cacheName);
            return await Reflect.apply(methodRef, thisArg, args);
        });
    }

    private createCacheEvictSingleEntryProxyMethod(originalMethod, cacheName) {
        return ProxyUtils.createMethodProxy(originalMethod, async(methodRef, thisArg, args) => {
            let hash = this.createHash(args);
            this.cacheProvider.del(hash, cacheName);
            return await Reflect.apply(methodRef, thisArg, args);
        })
    }

    private createHash(args) {
        return hash(args);
    }
}