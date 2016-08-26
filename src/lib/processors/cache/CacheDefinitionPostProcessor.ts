import * as hash from "object-hash";
import { ComponentDefinitionPostProcessor } from "../ComponentDefinitionPostProcessor";
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
        this.cacheProxyMethods.set(CacheDecoratorType.CACHE_PUT, this.createCachePutProxyMethod);
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
            let key = this.createHashKey(cacheConfigItem.key, methodRef, args);
            let hash = this.createHash(key);

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
            return this.createCacheEvictAllEntriesProxyMethod(originalMethod, cacheConfigItem);
        } else {
            return this.createCacheEvictSingleEntryProxyMethod(originalMethod, cacheConfigItem);
        }
    }

    private createCacheEvictAllEntriesProxyMethod(originalMethod, cacheConfigItem: CacheConfigItem) {
        return ProxyUtils.createMethodProxy(originalMethod, async(methodRef, thisArg, args) => {
            this.cacheProvider = <ICacheProvider> this.injector.getComponent(I_CACHE_PROVIDER_TOKEN);
            this.cacheProvider.flushdb(cacheConfigItem.cacheName);
            return await Reflect.apply(methodRef, thisArg, args);
        });
    }

    private createCacheEvictSingleEntryProxyMethod(originalMethod, cacheConfigItem: CacheConfigItem) {
        return ProxyUtils.createMethodProxy(originalMethod, async(methodRef, thisArg, args) => {
            let key = this.createHashKey(cacheConfigItem.key, methodRef, args);
            let hash = this.createHash(key);

            this.cacheProvider = <ICacheProvider> this.injector.getComponent(I_CACHE_PROVIDER_TOKEN);
            this.cacheProvider.del(hash, cacheConfigItem.cacheName);
            return await Reflect.apply(methodRef, thisArg, args);
        });
    }

    private createCachePutProxyMethod(originalMethod, cacheConfigItem: CacheConfigItem) {
        return ProxyUtils.createMethodProxy(originalMethod, async(methodRef, thisArg, args) => {
            let key = this.createHashKey(cacheConfigItem.key, methodRef, args);
            let hash = this.createHash(key);

            this.cacheProvider = <ICacheProvider> this.injector.getComponent(I_CACHE_PROVIDER_TOKEN);
            let result = await Reflect.apply(methodRef, thisArg, args);
            await this.cacheProvider.set(hash, result, cacheConfigItem.cacheName);
            return result;
        });
    }

    private createHash(args) {
        return hash(args);
    }

    private createHashKey(key: string, methodRef, args) {
        if (key === undefined) {
            return args;
        }

        let differentKeys = key.split('#').slice(1);
        let methodArgumentNames = this.getFunctionArgumentnames(methodRef);
        let keys = [];
        for (let differentKey of differentKeys) {
            let keyFragments = differentKey.split('.');
            let i = 0;
            for (let methodArgumentName of methodArgumentNames) {
                let actualArgument = args[i];
                i++;

                if (methodArgumentName === keyFragments[0]) {
                    let key = this.isKeyFound(actualArgument, keyFragments.slice(1));
                    if (key !== undefined) {
                        keys.push(key);
                    }
                }
            }
        }
        if (keys.length === 0) {
            return args;
        }
        return keys;
    }

    private isKeyFound(argument, keyFragments: Array<any>) {
        if (keyFragments.length === 0) {
            return argument;
        }
        for (let key in argument) {
            if (key === keyFragments[0]) {
                if (keyFragments.length === 1) {
                    return argument[key];
                }
                return this.isKeyFound(argument[key], keyFragments.slice(1));
            }
        }
    }

    private getFunctionArgumentnames(func) {
    return (func + '')
        .replace(/[/][/].*$/mg, '') // strip single-line comments
        .replace(/\s+/g, '') // strip white space
        .replace(/[/][*][^/*]*[*][/]/g, '') // strip multi-line comments
        .split('){', 1)[0].replace(/^[^(]*[(]/, '') // extract the parameters
        .replace(/=[^,]+/g, '') // strip any ES6 defaults
        .split(',').filter(Boolean); // split & filter [""]
    }
}