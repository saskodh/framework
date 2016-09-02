import * as hash from "object-hash";
import * as _ from "lodash";
import { ComponentDefinitionPostProcessor } from "../ComponentDefinitionPostProcessor";
import { ProxyUtils } from "../../helpers/ProxyUtils";
import { Injector } from "../../di/Injector";
import { ICacheProvider, I_CACHE_PROVIDER_TOKEN } from "./ICacheProvider";
import { LoggerFactory } from "../../helpers/logging/LoggerFactory";
import { ComponentUtil } from "../../decorators/ComponentDecorator";
import { DecoratorHelper } from "../../decorators/common/DecoratorHelper";
import { CacheDecoratorMetadata, CacheConfigItem } from "../../decorators/cache/CacheClasses";
import { CacheDecoratorType } from "../../decorators/cache/CacheDecoratorType";
import { Order } from "../../decorators/OrderDecorator";

let logger = LoggerFactory.getInstance();

@Order(-1)
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
        this.cacheProxyMethods.set(CacheDecoratorType.CACHEABLE.cacheTypeName, this.createCacheableProxyMethod);
        this.cacheProxyMethods.set(CacheDecoratorType.CACHE_EVICT.cacheTypeName, this.createCacheEvictProxyMethod);
        this.cacheProxyMethods.set(CacheDecoratorType.CACHE_PUT.cacheTypeName, this.createCachePutProxyMethod);
    }

    postProcessDefinition(componentConstructor: FunctionConstructor): any {

        class CacheProxy extends componentConstructor {}

        for (let cacheDecoratorType of CacheDecoratorType.getAllCacheDecoratorTypes()) {
            let cacheConfigArray = DecoratorHelper
                .getMetadata(CacheProxy, cacheDecoratorType.cacheDecorator, new CacheDecoratorMetadata());
            for (let cacheConfig of cacheConfigArray.methods) {
                let originalMethod = CacheProxy.prototype[cacheConfig.method];
                logger.debug(`Setting ${cacheDecoratorType.cacheTypeName} proxy on ${ComponentUtil
                    .getComponentData(componentConstructor).componentName}.${originalMethod.name}()`);
                let proxiedMethod = this.cacheProxyMethods.get(cacheDecoratorType.cacheTypeName)
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
        console.log("NOW");
        let methodArgumentNames = this.getFunctionArgumentNames(methodRef);
        let keys = [];
        for (let differentKey of differentKeys) {
            let keyFragments = differentKey.split('.');
            let i = 0;
            for (let methodArgumentName of methodArgumentNames) {
                let actualArgument = args[i];
                i++;

                if (methodArgumentName === keyFragments[0]) {
                    let key = _.get(actualArgument, keyFragments.slice(1));
                    if (key !== undefined) {
                        keys.push(key);
                    }
                    logger.warn(`Unable to find value for key ${differentKey}.`);
                }
            }
        }
        if (keys.length === 0) {
            return args;
        }
        return keys;
    }

    private getFunctionArgumentNames(func) {
    return (func + '')
        .replace(/[/][/].*$/mg, '') // strip single-line comments
        .replace(/\s+/g, '') // strip white space
        .replace(/[/][*][^/*]*[*][/]/g, '') // strip multi-line comments
        .split('){', 1)[0].replace(/^[^(]*[(]/, '') // extract the parameters
        .replace(/=[^,]+/g, '') // strip any ES6 defaults
        .split(',').filter(Boolean); // split & filter [""]
    }
}