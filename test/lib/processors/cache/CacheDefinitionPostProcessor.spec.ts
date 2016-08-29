import * as hash from "object-hash";
import {expect} from 'chai';
import { stub, spy, match } from 'sinon';
import {ProxyUtils} from '../../../../src/lib/helpers/ProxyUtils';
import { CacheDefinitionPostProcessor } from "../../../../src/lib/processors/cache/CacheDefinitionPostProcessor";
import {
    Cacheable, CacheEvict, CachePut, CacheDecoratorType,
    CacheUtil
} from "../../../../src/lib/decorators/CacheableDecorator";
import { I_CACHE_PROVIDER_TOKEN } from "../../../../src/lib/processors/cache/ICacheProvider";

describe('CacheDefinitionPostProcessor', function () {
    let cacheDefinitionPostProcessor;
    let myCacheDefinitionPostProcessor;
    beforeEach(() => {
        cacheDefinitionPostProcessor = new CacheDefinitionPostProcessor();
        myCacheDefinitionPostProcessor = <any> cacheDefinitionPostProcessor;
    });

    it('should create cache', async function () {
        // given
        class ClassA {
            @Cacheable({ cacheName: 'cacheOne', key: 'first' })
            methodOne(first, second, third) { return 'cacheable'; }

            @CacheEvict({ cacheName: 'cacheOne', allEntries: false})
            methodTwo(first) { return 'evict'; }

            @CachePut({ cacheName: 'cacheOne', key: 'first' })
            methodThree(first, second) { return 'put'; }
        }
        let stubOnGetAllCacheDecoratorTypes = spy(CacheDecoratorType, 'getAllCacheDecoratorTypes');
        let stubOnGetCacheTypeConfig = spy(CacheUtil, 'getCacheTypeConfig');
        let stub1 = stub().returns('proxied_method_cacheable');
        let stub2 = stub().returns('proxied_method_cache_evict');
        let stub3 = stub().returns('proxied_method_cache_put');
        let stubOnCreateProxyMethod = stub(myCacheDefinitionPostProcessor.cacheProxyMethods, 'get');
        stubOnCreateProxyMethod.withArgs('cacheable').returns(stub1);
        stubOnCreateProxyMethod.withArgs('cacheEvict').returns(stub2);
        stubOnCreateProxyMethod.withArgs('cachePut').returns(stub3);
        let stubOnReflectSet = stub(Reflect, 'set');

        // when
        let proxiedClass = myCacheDefinitionPostProcessor.postProcessDefinition(ClassA);

        //  then
        expect(stubOnGetAllCacheDecoratorTypes.calledOnce).to.be.true;
        expect(stubOnGetCacheTypeConfig.calledThrice).to.be.true;
        expect(stubOnGetCacheTypeConfig.calledWith(ClassA.prototype, CacheDecoratorType.CACHEABLE)).to.be.true;
        expect(stubOnGetCacheTypeConfig.calledWith(ClassA.prototype, CacheDecoratorType.CACHE_EVICT)).to.be.true;
        expect(stubOnGetCacheTypeConfig.calledWith(ClassA.prototype, CacheDecoratorType.CACHE_PUT)).to.be.true;
        expect(stubOnReflectSet.calledThrice).to.be.true;
        expect(stubOnReflectSet.calledWith(proxiedClass.prototype, 'methodOne', 'proxied_method_cacheable')).to.be.true;
        expect(stubOnReflectSet
            .calledWith(proxiedClass.prototype, 'methodTwo', 'proxied_method_cache_evict')).to.be.true;
        expect(stubOnReflectSet
            .calledWith(proxiedClass.prototype, 'methodThree', 'proxied_method_cache_put')).to.be.true;

        // cleanup
        stubOnGetAllCacheDecoratorTypes.restore();
        stubOnGetCacheTypeConfig.restore();
        stubOnCreateProxyMethod.restore();
        stubOnReflectSet.restore();
    });

    it('should create proxy method which will not return from the cache', async function () {
        // given
        class A {
            methodOne(first) { return 'methodOneResult'; }
        }
        let instanceOfA = new A();
        let methodOne = instanceOfA.methodOne;
        let injector =  {
            getComponent: () => { return; }
        };
        let cacheConfigItem =  {
            cacheName: 'cacheName',
            key: 'firstKey'
        };
        let cacheProvider =  {
            get: () => {}, // tslint:disable-line
            set: () => {} // tslint:disable-line
        };
        let hashKeys = ['one'];
        myCacheDefinitionPostProcessor.injector = injector;
        let spyOnCreateMethodProxy = spy(ProxyUtils, 'createMethodProxy');
        let stubOnGetComponent = stub(myCacheDefinitionPostProcessor.injector, 'getComponent').returns(cacheProvider);
        let stubOnCacheProviderGet = stub(cacheProvider, 'get').returns(null);
        let stubOnCacheProviderSet = stub(cacheProvider, 'set');
        let stubOnReflectApply = stub(Reflect, 'apply').returns(Promise.resolve('Db result'));
        let stubOnCreateHashKey = stub (cacheDefinitionPostProcessor, 'createHashKey').returns(hashKeys);
        let stubOnCreateHash = stub (cacheDefinitionPostProcessor, 'createHash').returns('hashOne');
        // when
        let cacheableProxy = myCacheDefinitionPostProcessor.createCacheableProxyMethod(methodOne, cacheConfigItem);
        Reflect.set(A.prototype, 'methodOne', cacheableProxy);
        let result = await instanceOfA.methodOne('firstValue');

        //  then
        expect(spyOnCreateMethodProxy.calledOnce).to.be.true;
        expect(stubOnCreateHashKey.calledOnce).to.be.true;
        expect(stubOnCreateHashKey.calledWith(cacheConfigItem.key, match.func, ['firstValue'])).to.be.true;
        expect(stubOnCreateHash.calledWith(hashKeys)).to.be.true;
        expect(stubOnGetComponent.calledOnce).to.be.true;
        expect(stubOnGetComponent.calledWith(I_CACHE_PROVIDER_TOKEN)).to.be.true;
        expect(stubOnCacheProviderGet.calledOnce).to.be.true;
        expect(stubOnCacheProviderGet.calledWith('hashOne', cacheConfigItem.cacheName)).to.be.true;
        expect(stubOnReflectApply.calledOnce).to.be.true;
        expect(stubOnReflectApply.calledWith(match.func, instanceOfA, ['firstValue'])).to.be.true;
        expect(stubOnCacheProviderSet.calledOnce).to.be.true;
        expect(stubOnCacheProviderSet.calledWith('hashOne', 'Db result', cacheConfigItem.cacheName)).to.be.true;
        expect(result).to.be.eq('Db result');
        // cleanup
        spyOnCreateMethodProxy.restore();
        stubOnGetComponent.restore();
        stubOnCacheProviderGet.restore();
        stubOnCacheProviderSet.restore();
        stubOnReflectApply.restore();
        stubOnCreateHashKey.restore();
        stubOnCreateHash.restore();
    });

    it('should create proxy method which will return from the cache', async function () {
        // given
        class A {
            methodOne(first) { return 'methodOneResult'; }
        }
        let instanceOfA = new A();
        let methodOne = instanceOfA.methodOne;
        let injector =  {
            getComponent: () => { return; }
        };
        let cacheConfigItem =  {
            cacheName: 'cacheName',
            key: 'firstKey'
        };
        let cacheProvider =  {
            get: () => {}, // tslint:disable-line
            set: () => {} // tslint:disable-line
        };
        let hashKeys = ['one'];
        myCacheDefinitionPostProcessor.injector = injector;
        let spyOnCreateMethodProxy = spy(ProxyUtils, 'createMethodProxy');
        let stubOnGetComponent = stub(myCacheDefinitionPostProcessor.injector, 'getComponent').returns(cacheProvider);
        let stubOnCacheProviderGet = stub(cacheProvider, 'get').returns('Cache result');
        let stubOnCacheProviderSet = stub(cacheProvider, 'set');
        let stubOnReflectApply = stub(Reflect, 'apply').returns(Promise.resolve('Db result'));
        let stubOnCreateHashKey = stub (cacheDefinitionPostProcessor, 'createHashKey').returns(hashKeys);
        let stubOnCreateHash = stub (cacheDefinitionPostProcessor, 'createHash').returns('hashOne');
        // when
        let cacheableProxy = myCacheDefinitionPostProcessor.createCacheableProxyMethod(methodOne, cacheConfigItem);
        Reflect.set(A.prototype, 'methodOne', cacheableProxy);
        let result = await instanceOfA.methodOne('firstValue');

        //  then
        expect(spyOnCreateMethodProxy.calledOnce).to.be.true;
        expect(stubOnCreateHashKey.calledOnce).to.be.true;
        expect(stubOnCreateHashKey.calledWith(cacheConfigItem.key, match.func, ['firstValue'])).to.be.true;
        expect(stubOnCreateHash.calledWith(hashKeys)).to.be.true;
        expect(stubOnGetComponent.calledOnce).to.be.true;
        expect(stubOnGetComponent.calledWith(I_CACHE_PROVIDER_TOKEN)).to.be.true;
        expect(stubOnCacheProviderGet.calledOnce).to.be.true;
        expect(stubOnCacheProviderGet.calledWith('hashOne', cacheConfigItem.cacheName)).to.be.true;
        expect(stubOnReflectApply.callCount).to.be.eq(0);
        expect(stubOnCacheProviderSet.callCount).to.be.eq(0);
        expect(result).to.be.eq('Cache result');
        // cleanup
        spyOnCreateMethodProxy.restore();
        stubOnGetComponent.restore();
        stubOnCacheProviderGet.restore();
        stubOnCacheProviderSet.restore();
        stubOnReflectApply.restore();
        stubOnCreateHashKey.restore();
        stubOnCreateHash.restore();
    });

    it('should delegate the cache evict creation to the all entries method', async function () {
        // given
        let cacheConfigItem = {
            cacheName: 'cacheName',
            method: 'methodOne',
            allEntries: true
        };
        let stubOnCreateCacheEvictAllEntriesProxyMethod =
            stub(cacheDefinitionPostProcessor, 'createCacheEvictAllEntriesProxyMethod').returns('CorrectPick');
        let stubOnCreateCacheEvictSingleEntryProxyMethod =
            stub(cacheDefinitionPostProcessor, 'createCacheEvictSingleEntryProxyMethod');

        // when
        let methodPicked = myCacheDefinitionPostProcessor
            .createCacheEvictProxyMethod('originalMethod', cacheConfigItem);

        //  then
        expect(methodPicked).to.be.eq('CorrectPick');
        expect(stubOnCreateCacheEvictAllEntriesProxyMethod.calledOnce).to.be.true;
        expect(stubOnCreateCacheEvictAllEntriesProxyMethod.calledWith('originalMethod', cacheConfigItem)).to.be.true;
        expect(stubOnCreateCacheEvictSingleEntryProxyMethod.callCount).to.be.eq(0);
        // cleanup
        stubOnCreateCacheEvictAllEntriesProxyMethod.restore();
        stubOnCreateCacheEvictSingleEntryProxyMethod.restore();
    });

    it('should delegate the cache evict creation to the single entry method', async function () {
        // given
        let cacheConfigItem = {
            cacheName: 'cacheName',
            method: 'methodOne',
            allEntries: false
        };
        let stubOnCreateCacheEvictAllEntriesProxyMethod =
            stub(cacheDefinitionPostProcessor, 'createCacheEvictAllEntriesProxyMethod');
        let stubOnCreateCacheEvictSingleEntryProxyMethod =
            stub(cacheDefinitionPostProcessor, 'createCacheEvictSingleEntryProxyMethod').returns('CorrectPick');

        // when
        let methodPicked = myCacheDefinitionPostProcessor
            .createCacheEvictProxyMethod('originalMethod', cacheConfigItem);

        //  then
        expect(methodPicked).to.be.eq('CorrectPick');
        expect(stubOnCreateCacheEvictSingleEntryProxyMethod.calledOnce).to.be.true;
        expect(stubOnCreateCacheEvictSingleEntryProxyMethod.calledWith('originalMethod', cacheConfigItem)).to.be.true;
        expect(stubOnCreateCacheEvictAllEntriesProxyMethod.callCount).to.be.eq(0);
        // cleanup
        stubOnCreateCacheEvictAllEntriesProxyMethod.restore();
        stubOnCreateCacheEvictSingleEntryProxyMethod.restore();
    });

    it('should delete all entries from the cache', async function () {
        // given
        class A {
            methodOne(first) { return 'methodOneResult'; }
        }
        let instanceOfA = new A();
        let methodOne = instanceOfA.methodOne;
        let injector =  {
            getComponent: () => { return; }
        };
        let cacheConfigItem =  {
            cacheName: 'cacheName',
            key: 'firstKey'
        };
        let cacheProvider =  {
            get: () => {}, // tslint:disable-line
            set: () => {}, // tslint:disable-line
            flushdb: () => {} // tslint:disable-line
        };
        myCacheDefinitionPostProcessor.injector = injector;
        let spyOnCreateMethodProxy = spy(ProxyUtils, 'createMethodProxy');
        let stubOnGetComponent = stub(myCacheDefinitionPostProcessor.injector, 'getComponent').returns(cacheProvider);
        let stubOnCacheProviderFlushDb = stub(cacheProvider, 'flushdb');
        let stubOnReflectApply = stub(Reflect, 'apply').returns(Promise.resolve('Cache delete'));

        // when
        let cacheableProxy = myCacheDefinitionPostProcessor
            .createCacheEvictAllEntriesProxyMethod(methodOne, cacheConfigItem);
        Reflect.set(A.prototype, 'methodOne', cacheableProxy);
        let result = await instanceOfA.methodOne('firstValue');

        //  then
        expect(spyOnCreateMethodProxy.calledOnce).to.be.true;
        expect(stubOnGetComponent.calledOnce).to.be.true;
        expect(stubOnGetComponent.calledWith(I_CACHE_PROVIDER_TOKEN)).to.be.true;
        expect(stubOnCacheProviderFlushDb.calledOnce).to.be.true;
        expect(stubOnCacheProviderFlushDb.calledWith(cacheConfigItem.cacheName)).to.be.true;
        expect(stubOnReflectApply.calledOnce).to.be.true;
        expect(result).to.be.eq('Cache delete');
        // cleanup
        spyOnCreateMethodProxy.restore();
        stubOnGetComponent.restore();
        stubOnCacheProviderFlushDb.restore();
        stubOnReflectApply.restore();
    });

    it('should delete a single entry from the cache', async function () {
        // given
        class A {
            methodOne(first) { return 'methodOneResult'; }
        }
        let instanceOfA = new A();
        let methodOne = instanceOfA.methodOne;
        let injector =  {
            getComponent: () => { return; }
        };
        let cacheConfigItem =  {
            cacheName: 'cacheName',
            key: 'firstKey'
        };
        let cacheProvider =  {
            get: () => {}, // tslint:disable-line
            set: () => {}, // tslint:disable-line
            del: () => {} // tslint:disable-line
        };
        let hashKey = ['one'];
        myCacheDefinitionPostProcessor.injector = injector;
        let spyOnCreateMethodProxy = spy(ProxyUtils, 'createMethodProxy');
        let stubOnCreateHashKey = stub(cacheDefinitionPostProcessor, 'createHashKey').returns(hashKey);
        let stubOnCreateHash = stub(cacheDefinitionPostProcessor, 'createHash').returns('hashOne');
        let stubOnGetComponent = stub(myCacheDefinitionPostProcessor.injector, 'getComponent').returns(cacheProvider);
        let stubOnCacheProviderDel = stub(cacheProvider, 'del');
        let stubOnReflectApply = stub(Reflect, 'apply').returns(Promise.resolve('Cache delete'));

        // when
        let cacheableProxy = myCacheDefinitionPostProcessor
            .createCacheEvictSingleEntryProxyMethod(methodOne, cacheConfigItem);
        Reflect.set(A.prototype, 'methodOne', cacheableProxy);
        let result = await instanceOfA.methodOne('firstValue');

        //  then
        expect(spyOnCreateMethodProxy.calledOnce).to.be.true;
        expect(stubOnCreateHashKey.calledOnce).to.be.true;
        expect(stubOnCreateHashKey.calledWith(cacheConfigItem.key, match.func, ['firstValue'])).to.be.true;
        expect(stubOnCreateHash.calledOnce).to.be.true;
        expect(stubOnCreateHash.calledWith(hashKey)).to.be.true;
        expect(stubOnGetComponent.calledOnce).to.be.true;
        expect(stubOnGetComponent.calledWith(I_CACHE_PROVIDER_TOKEN)).to.be.true;
        expect(stubOnCacheProviderDel.calledOnce).to.be.true;
        expect(stubOnCacheProviderDel.calledWith('hashOne', cacheConfigItem.cacheName)).to.be.true;
        expect(stubOnReflectApply.calledOnce).to.be.true;
        expect(result).to.be.eq('Cache delete');
        // cleanup
        spyOnCreateMethodProxy.restore();
        stubOnCreateHashKey.restore();
        stubOnCreateHash.restore();
        stubOnGetComponent.restore();
        stubOnCacheProviderDel.restore();
        stubOnReflectApply.restore();
    });

    it('should create proxy method which will always set in the cache', async function () {
        // given
        class A {
            methodOne(first) { return 'methodOneResult'; }
        }
        let instanceOfA = new A();
        let methodOne = instanceOfA.methodOne;
        let injector =  {
            getComponent: () => { return; }
        };
        let cacheConfigItem =  {
            cacheName: 'cacheName',
            key: 'firstKey'
        };
        let cacheProvider =  {
            get: () => {}, // tslint:disable-line
            set: () => {} // tslint:disable-line
        };
        let hashKeys = ['one'];
        myCacheDefinitionPostProcessor.injector = injector;
        let spyOnCreateMethodProxy = spy(ProxyUtils, 'createMethodProxy');
        let stubOnGetComponent = stub(myCacheDefinitionPostProcessor.injector, 'getComponent').returns(cacheProvider);
        let stubOnCacheProviderSet = stub(cacheProvider, 'set');
        let stubOnReflectApply = stub(Reflect, 'apply').returns(Promise.resolve('Db result'));
        let stubOnCreateHashKey = stub (cacheDefinitionPostProcessor, 'createHashKey').returns(hashKeys);
        let stubOnCreateHash = stub (cacheDefinitionPostProcessor, 'createHash').returns('hashOne');
        // when
        let cacheableProxy = myCacheDefinitionPostProcessor.createCachePutProxyMethod(methodOne, cacheConfigItem);
        Reflect.set(A.prototype, 'methodOne', cacheableProxy);
        let result = await instanceOfA.methodOne('firstValue');

        //  then
        expect(spyOnCreateMethodProxy.calledOnce).to.be.true;
        expect(stubOnCreateHashKey.calledOnce).to.be.true;
        expect(stubOnCreateHashKey.calledWith(cacheConfigItem.key, match.func, ['firstValue'])).to.be.true;
        expect(stubOnCreateHash.calledWith(hashKeys)).to.be.true;
        expect(stubOnGetComponent.calledOnce).to.be.true;
        expect(stubOnGetComponent.calledWith(I_CACHE_PROVIDER_TOKEN)).to.be.true;
        expect(stubOnReflectApply.calledOnce).to.be.true;
        expect(stubOnReflectApply.calledWith(match.func, instanceOfA, ['firstValue'])).to.be.true;
        expect(stubOnCacheProviderSet.calledOnce).to.be.true;
        expect(stubOnCacheProviderSet.calledWith('hashOne', 'Db result', cacheConfigItem.cacheName)).to.be.true;
        expect(result).to.be.eq('Db result');
        // cleanup
        spyOnCreateMethodProxy.restore();
        stubOnGetComponent.restore();
        stubOnCacheProviderSet.restore();
        stubOnReflectApply.restore();
        stubOnCreateHashKey.restore();
        stubOnCreateHash.restore();
    });

    it('should create the key for the cache hash', async function () {
        // given
        class A {
            methodOne(first, second, third) { return 'methodOneResult'; }
        }
        class B {
            private prop1: string;
            private prop2: C;

            constructor() {
                this.prop1 = 'property1';
                this.prop2 = new C();
            }
        }
        class C {
            private name: string;

            constructor() {
                this.name = 'nameC';
            }
        }
        let instanceOfA = new A();

        // when
        let keys = myCacheDefinitionPostProcessor
            .createHashKey('#first.prop1#third.prop2.name#first.unknown#second.prop',
                instanceOfA.methodOne, [new B(), 'someArg', new B()]);

        //  then
        expect(keys).to.include.members(['property1', 'nameC']);
    });

    it('should return all args if no keys are found', async function () {
        // given
        class A {
            methodOne(first, second, third) { return 'methodOneResult'; }
        }
        class B {
            private prop1: string;
            private prop2: C;

            constructor() {
                this.prop1 = 'property1';
                this.prop2 = new C();
            }
        }
        class C {
            private name: string;

            constructor() {
                this.name = 'nameC';
            }
        }
        let instanceOfA = new A();
        let arg1 = new B();
        let arg2 = 'someArg';
        let arg3 = new B();

        // when
        let keys = myCacheDefinitionPostProcessor
            .createHashKey('#first.prop1.noProp#third.prop3.name#first.unknown#fourth.prop',
                instanceOfA.methodOne, [arg1, arg2, arg3]);

        //  then
        expect(keys).to.include.members([arg1, arg2, arg3]);
    });

    it('should return all args as key when the key is undefined', async function () {
        // given
        class A {
            methodOne(first, second, third) { return 'methodOneResult'; }
        }
        class B {
            private prop1: string;
            private prop2: C;

            constructor() {
                this.prop1 = 'property1';
                this.prop2 = new C();
            }
        }
        class C {
            private name: string;

            constructor() {
                this.name = 'nameC';
            }
        }
        let instanceOfA = new A();
        let arg1 = new B();
        let arg2 = 'someArg';
        let arg3 = new B();

        // when
        let keys = myCacheDefinitionPostProcessor
            .createHashKey(undefined,
                instanceOfA.methodOne, [arg1, arg2, arg3]);

        //  then
        expect(keys).to.include.members([arg1, arg2, arg3]);
    });



    it('should return the hash for the given arguments', async function () {
        // given
        let args = ['arg1', 'arg2', 5, new Object()];
        let staticHash = hash(args);

        // when
        let createdHash = myCacheDefinitionPostProcessor.createHash(args);

        //  then
        expect(createdHash).to.be.eq(staticHash);
    });
});