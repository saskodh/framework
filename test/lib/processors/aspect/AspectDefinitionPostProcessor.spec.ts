import {expect} from 'chai';
import {
    Aspect, Before, After, AdviceType, Pointcut, ProceedingJoinPoint,
    PointcutList, AspectUtil
} from "../../../../src/lib/decorators/AspectDecorator";
import { stub, spy, match } from "sinon";
import {AspectDefinitionPostProcessor} from "../../../../src/lib/processors/aspect/AspectDefinitionPostProcessor";
import {ProxyUtils} from "../../../../src/lib/helpers/ProxyUtils";
import { ReflectUtils } from "../../../../src/lib/helpers/ReflectUtils";
import { ComponentUtil } from "../../../../src/lib/decorators/ComponentDecorator";
require("reflect-metadata");

describe('AspectDefinitionPostProcessor', function () {
    let aspectDefinitionPostProcessor;
    let MyAspectDefinitionPostProcessor;
    beforeEach(() => {
        aspectDefinitionPostProcessor = new AspectDefinitionPostProcessor();
        MyAspectDefinitionPostProcessor = <any> aspectDefinitionPostProcessor;
    });

    it('should create aspects', async function () {
        // given
        class ClassA {
            methodOne() { return true; }
            methodTwo() { return false; }
        }
        @Aspect()
        class AspectA {
            @Before({ classRegex: /^ClassA$/, methodRegex: /^methodOne$/ })
            doSomethingBefore() { return; }

            @Before({ classRegex: 'NonExistingClass', methodRegex: 'methodThree' })
            doNothingBefore() { return; }
        }
        @Aspect()
        class AspectB {
            @After({ classRegex: /^ClassA$/, methodRegex: /^methodTwo$/})
            doSomethingAfter() { return; }
        }
        let localAspectDefinitionPostProcessor = <any> aspectDefinitionPostProcessor;
        let classAName = { componentName: 'ClassA'};
        let methodNames = ['constructor', 'methodOne', 'methodTwo'];
        let pointcut1 = new Pointcut({ classRegex: /^ClassA$/, methodRegex: /^methodOne$/ }, 'doSomethingBefore');
        let pointcut3 =
            new Pointcut({ classRegex: 'NonExistingClass', methodRegex: 'methodThree' }, 'doNothingBefore');
        let pointCutList1 = new PointcutList();
        pointCutList1.pointcuts.get('before').push(pointcut1);
        pointCutList1.pointcuts.get('before').push(pointcut3);

        let pointcut2 = new Pointcut({ classRegex: /^ClassA$/, methodRegex: /^methodTwo$/ }, 'doSomethingAfter');
        let pointCutList2 = new PointcutList();
        pointCutList2.pointcuts.get('after').push(pointcut2);

        let aspects = [AspectA, AspectB];
        aspectDefinitionPostProcessor.setAspectComponentDefinitions(aspects);
        let stubOnGetClassToken = stub(ComponentUtil, 'getClassToken');
        stubOnGetClassToken.withArgs(AspectA).returns('aspectA_token');
        stubOnGetClassToken.withArgs(AspectB).returns('aspectB_token');
        let stubOnGetAllAdviceTypes = stub(AdviceType, 'getAllAdviceTypes').returns(['before', 'after']);
        let stubOnGetPointcuts = stub(AspectUtil, 'getPointcuts', (classProto, method) => {
            if (classProto === AspectA.prototype) {
                if (method === 'before') {
                    return pointCutList1.pointcuts.get('before');
                } else {
                    return [];
                }
            } else if (classProto === AspectB.prototype) {
                if (method === 'before') {
                    return [];
                } else {
                    return pointCutList2.pointcuts.get('after');
                }
            }
            return [];
        });
        let stubOnGetComponentData = stub(ComponentUtil, 'getComponentData');
        stubOnGetComponentData.withArgs(ClassA).returns(classAName);
        let stubOnGetAllMethodsNames = stub(ReflectUtils, 'getAllMethodsNames').returns(methodNames);
        let stub1 = stub().returns('proxied_method_before');
        let stub2 = stub().returns('proxied_method_after');
        let stubOnCreateProxyMethod = stub(localAspectDefinitionPostProcessor.adviceProxyMethods, 'get');
        stubOnCreateProxyMethod.withArgs('before').returns(stub1);
        stubOnCreateProxyMethod.withArgs('after').returns(stub2);
        let stubOnReflectSet = stub(Reflect, 'set');

        // when
        let proxiedClass = aspectDefinitionPostProcessor.postProcessDefinition(ClassA);

        //  then
        expect(stubOnGetClassToken.calledWith(AspectA)).to.be.true;
        expect(stubOnGetClassToken.calledWith(AspectB)).to.be.true;
        expect(stubOnGetAllAdviceTypes.callCount).to.be.eq(2);
        expect(stubOnGetPointcuts.callCount).to.be.eq(4);
        expect(stubOnGetPointcuts.calledWith(AspectA.prototype, 'before')).to.be.true;
        expect(stubOnGetPointcuts.calledWith(AspectA.prototype, 'after')).to.be.true;
        expect(stubOnGetPointcuts.calledWith(AspectB.prototype, 'before')).to.be.true;
        expect(stubOnGetPointcuts.calledWith(AspectB.prototype, 'after')).to.be.true;
        expect(stubOnGetComponentData.callCount).to.be.eq(3);
        expect(stubOnGetComponentData.calledWith(ClassA)).to.be.true;
        expect(stubOnGetAllMethodsNames.callCount).to.be.eq(2);
        expect(stubOnGetAllMethodsNames.calledWith(ClassA)).to.be.true;
        expect(stubOnCreateProxyMethod.callCount).to.be.eq(2);
        expect(stubOnCreateProxyMethod.calledWith('before')).to.be.true;
        expect(stubOnCreateProxyMethod.calledWith('after')).to.be.true;
        expect(stub1.callCount).to.be.eq(1);
        expect(stub1.calledWith(ClassA.prototype['methodOne'])).to.be.true;
        expect(stub2.callCount).to.be.eq(1);
        expect(stub2.calledWith(ClassA.prototype['methodTwo'])).to.be.true;
        expect(stubOnReflectSet.callCount).to.be.eq(2);
        expect(stubOnReflectSet.calledWith(proxiedClass.prototype, 'methodOne', 'proxied_method_before')).to.be.true;
        expect(stubOnReflectSet.calledWith(proxiedClass.prototype, 'methodTwo', 'proxied_method_after')).to.be.true;

        // cleanup
        stubOnGetClassToken.restore();
        stubOnGetAllAdviceTypes.restore();
        stubOnGetPointcuts.restore();
        stubOnGetComponentData.restore();
        stubOnGetAllMethodsNames.restore();
        stubOnCreateProxyMethod.restore();
        stubOnReflectSet.restore();
    });

    it('should initialize the aspectDefinitionPostProcessor', async function () {
        // given
        let localAspectDefinitionPostProcessor = <any> aspectDefinitionPostProcessor;
        let adviceProxyMethods = localAspectDefinitionPostProcessor.adviceProxyMethods;

        // when
        aspectDefinitionPostProcessor.initialize();

        // then
        expect(adviceProxyMethods.size).to.be.eq(5);
        expect(adviceProxyMethods.get(AdviceType.BEFORE))
            .to.be.eq(localAspectDefinitionPostProcessor.createBeforeProxyMethod);
        expect(adviceProxyMethods.get(AdviceType.AFTER))
            .to.be.eq(localAspectDefinitionPostProcessor.createAfterProxyMethod);
        expect(adviceProxyMethods.get(AdviceType.AFTER_RETURNING))
            .to.be.eq(localAspectDefinitionPostProcessor.createAfterReturningProxyMethod);
        expect(adviceProxyMethods.get(AdviceType.AFTER_THROWING))
            .to.be.eq(localAspectDefinitionPostProcessor.createAfterThrowingProxyMethod);
        expect(adviceProxyMethods.get(AdviceType.AROUND))
            .to.be.eq(localAspectDefinitionPostProcessor.createAroundProxyMethod);
    });

    it('should create proxy method which will execute the target method before the original', async function () {
        // given
        class A {
            methodOne() { return; }
        }
        class B {
            methodTwo() { return; }
        }
        let instanceOfA = new A();
        let instanceOfB = new B();
        let methodOne = instanceOfA.methodOne;
        let methodTwo = instanceOfB.methodTwo;
        let clazz =  'clazz';
        let injector =  {
            getComponent: () => { return; }
        };
        MyAspectDefinitionPostProcessor.injector = injector;
        let spyOnCreateMethodProxy = spy(ProxyUtils, 'createMethodProxy');
        let stubOnGetComponent = stub(MyAspectDefinitionPostProcessor.injector, 'getComponent').returns(instanceOfB);
        let stubOnReflectApply = stub(Reflect, 'apply').returns(Promise.resolve('resolved'));
        let stubOnPromiseRace = stub(Promise, 'race').returns(Promise.resolve('resolved'));

        // when
        let beforeProxy = MyAspectDefinitionPostProcessor
            .createBeforeProxyMethod(methodOne, methodTwo, clazz);
        Reflect.set(A.prototype, 'methodOne', beforeProxy);
        let promiseResult = await instanceOfA.methodOne();

        //  then
        expect(spyOnCreateMethodProxy.calledWith(methodOne, match.func)).to.be.true;
        expect(stubOnGetComponent.calledWith(clazz)).to.be.true;
        expect(stubOnReflectApply.calledWith(methodTwo, instanceOfB, [])).to.be.true;
        expect(stubOnReflectApply.calledWith(methodOne, instanceOfA, [])).to.be.true;
        expect(stubOnPromiseRace.calledTwice).to.be.true;
        expect(promiseResult).to.be.eq('resolved');
        // cleanup
        spyOnCreateMethodProxy.restore();
        stubOnGetComponent.restore();
        stubOnReflectApply.restore();
        stubOnPromiseRace.restore();
    });

    it('should create proxy method which will execute the target method after the original-return', async function () {
        // given
        class A {
            methodOne() { return; }
        }
        class B {
            methodTwo() { return; }
        }
        let instanceOfA = new A();
        let instanceOfB = new B();
        let methodOne = instanceOfA.methodOne;
        let methodTwo = instanceOfB.methodTwo;
        let clazz =  'clazz';
        let injector =  {
            getComponent: () => { return; }
        };
        MyAspectDefinitionPostProcessor.injector = injector;
        let spyOnCreateMethodProxy = spy(ProxyUtils, 'createMethodProxy');
        let stubOnGetComponent = stub(MyAspectDefinitionPostProcessor.injector, 'getComponent').returns(instanceOfB);
        let stubOnReflectApply = stub(Reflect, 'apply');
        let stubOnPromiseRace = stub(Promise, 'race').returns(Promise.resolve('resolved'));

        // when
        let afterProxy = MyAspectDefinitionPostProcessor
            .createAfterProxyMethod(methodOne, methodTwo, clazz);
        Reflect.set(A.prototype, 'methodOne', afterProxy);

        let promiseResult;
        let hasThrown = false;
        try {
            promiseResult = await instanceOfA.methodOne();
        } catch (err) {
            promiseResult = err;
            hasThrown = true;
        }

        //  then
        expect(hasThrown).to.be.false;
        expect(promiseResult).to.be.eql('resolved');
        expect(spyOnCreateMethodProxy.calledWith(methodOne, match.func)).to.be.true;
        expect(stubOnGetComponent.calledWith(clazz)).to.be.true;
        expect(stubOnReflectApply.calledWith(methodTwo, instanceOfB, ['resolved'])).to.be.true;
        expect(stubOnReflectApply.calledWith(methodOne, instanceOfA, [])).to.be.true;
        expect(stubOnPromiseRace.calledTwice).to.be.true;
        // cleanup
        spyOnCreateMethodProxy.restore();
        stubOnGetComponent.restore();
        stubOnReflectApply.restore();
        stubOnPromiseRace.restore();
    });

    it('should create proxy method which will execute the target method after the original-throw', async function () {
        // given
        class A {
            methodOne() { return; }
        }
        class B {
            methodTwo() { return; }
        }
        let instanceOfA = new A();
        let instanceOfB = new B();
        let methodOne = instanceOfA.methodOne;
        let methodTwo = instanceOfB.methodTwo;
        let clazz =  'clazz';
        let injector =  {
            getComponent: () => { return; }
        };
        MyAspectDefinitionPostProcessor.injector = injector;
        let error = new Error('new error');
        let spyOnCreateMethodProxy = spy(ProxyUtils, 'createMethodProxy');
        let stubOnGetComponent = stub(MyAspectDefinitionPostProcessor.injector, 'getComponent').returns(instanceOfB);
        let stubOnReflectApply = stub(Reflect, 'apply');
        let stubOnPromiseRace = stub(Promise, 'race').throws(error);

        // when
        let afterProxy = MyAspectDefinitionPostProcessor
            .createAfterProxyMethod(methodOne, methodTwo, clazz);
        Reflect.set(A.prototype, 'methodOne', afterProxy);

        let promiseResult;
        let hasThrown = false;
        try {
            promiseResult = await instanceOfA.methodOne();
        } catch (err) {
            promiseResult = err;
            hasThrown = true;
        }

        //  then
        expect(hasThrown).to.be.true;
        expect(promiseResult).to.be.eql(error);
        expect(spyOnCreateMethodProxy.calledWith(methodOne, match.func)).to.be.true;
        expect(stubOnGetComponent.calledWith(clazz)).to.be.true;
        expect(stubOnReflectApply.calledWith(methodTwo, instanceOfB, [error])).to.be.true;
        expect(stubOnReflectApply.calledWith(methodOne, instanceOfA, [])).to.be.true;
        expect(stubOnPromiseRace.called).to.be.true;
        // cleanup
        spyOnCreateMethodProxy.restore();
        stubOnGetComponent.restore();
        stubOnReflectApply.restore();
        stubOnPromiseRace.restore();
    });

    it('should create proxy method which will execute the target method after the original returns', async function () {
        // given
        class A {
            methodOne() { return; }
        }
        class B {
            methodTwo() { return; }
        }
        let instanceOfA = new A();
        let instanceOfB = new B();
        let methodOne = instanceOfA.methodOne;
        let methodTwo = instanceOfB.methodTwo;
        let clazz =  'clazz';
        let injector =  {
            getComponent: () => { return; }
        };
        MyAspectDefinitionPostProcessor.injector = injector;
        let spyOnCreateMethodProxy = spy(ProxyUtils, 'createMethodProxy');
        let stubOnGetComponent = stub(MyAspectDefinitionPostProcessor.injector, 'getComponent').returns(instanceOfB);
        let stubOnReflectApply = stub(Reflect, 'apply');
        let stubOnPromiseRace = stub(Promise, 'race').returns(Promise.resolve('resolved'));

        // when
        let afterReturningProxy = MyAspectDefinitionPostProcessor
            .createAfterReturningProxyMethod(methodOne, methodTwo, clazz);
        Reflect.set(A.prototype, 'methodOne', afterReturningProxy);
        let promiseResult = await instanceOfA.methodOne();

        //  then
        expect(spyOnCreateMethodProxy.calledWith(methodOne, match.func)).to.be.true;
        expect(stubOnGetComponent.calledWith(clazz)).to.be.true;
        expect(stubOnReflectApply.calledWith(methodTwo, instanceOfB, ['resolved'])).to.be.true;
        expect(stubOnReflectApply.calledWith(methodOne, instanceOfA, [])).to.be.true;
        expect(stubOnPromiseRace.calledTwice).to.be.true;
        expect(promiseResult).to.be.eq('resolved');
        // cleanup
        spyOnCreateMethodProxy.restore();
        stubOnGetComponent.restore();
        stubOnReflectApply.restore();
        stubOnPromiseRace.restore();
    });

    it('should create proxy method which will execute the target method after the original throws', async function () {
        // given
        class A {
            methodOne() { return; }
        }
        class B {
            methodTwo() { return; }
        }
        let instanceOfA = new A();
        let instanceOfB = new B();
        let methodOne = instanceOfA.methodOne;
        let methodTwo = instanceOfB.methodTwo;
        let clazz =  'clazz';
        let injector =  {
            getComponent: () => { return; }
        };
        MyAspectDefinitionPostProcessor.injector = injector;
        let error = new Error('new error');
        let spyOnCreateMethodProxy = spy(ProxyUtils, 'createMethodProxy');
        let stubOnGetComponent = stub(MyAspectDefinitionPostProcessor.injector, 'getComponent').returns(instanceOfB);
        let stubOnReflectApply = stub(Reflect, 'apply');
        stubOnReflectApply.withArgs(methodOne, instanceOfA, []).returns('error');
        stubOnReflectApply.withArgs(methodTwo, instanceOfB, [error]).returns('after throwing executed');
        let stubOnPromiseRace = stub(Promise, 'race');
        stubOnPromiseRace.withArgs(['error']).throws(error);

        // when
        let afterThrowingProxy = MyAspectDefinitionPostProcessor
            .createAfterThrowingProxyMethod(methodOne, methodTwo, clazz);
        Reflect.set(A.prototype, 'methodOne', afterThrowingProxy);

        let promiseResult;
        let hasThrown = false;
        try {
            await instanceOfA.methodOne();
        } catch (err) {
            promiseResult = err;
            hasThrown = true;
        }

        //  then
        expect(hasThrown).to.be.true;
        expect(promiseResult).to.be.eq(error);
        expect(spyOnCreateMethodProxy.calledWith(methodOne, match.func)).to.be.true;
        expect(stubOnGetComponent.calledWith(clazz)).to.be.true;
        expect(stubOnReflectApply.calledWith(methodTwo, instanceOfB, [error])).to.be.true;
        expect(stubOnReflectApply.calledWith(methodOne, instanceOfA, [])).to.be.true;
        expect(stubOnPromiseRace.calledTwice).to.be.true;
        expect(stubOnPromiseRace.calledWith(['error'])).to.be.true;
        expect(stubOnPromiseRace.calledWith(['after throwing executed'])).to.be.true;
        // cleanup
        spyOnCreateMethodProxy.restore();
        stubOnGetComponent.restore();
        stubOnReflectApply.restore();
        stubOnPromiseRace.restore();
    });

    it('should create proxy method which will execute the target method around the original', async function () {
        // given
        class A {
            methodOne() { return; }
        }
        class B {
            methodTwo() { return; }
        }
        let instanceOfA = new A();
        let instanceOfB = new B();
        let methodOne = instanceOfA.methodOne;
        let methodTwo = instanceOfB.methodTwo;
        let clazz =  'clazz';
        let injector =  {
            getComponent: () => { return; }
        };
        MyAspectDefinitionPostProcessor.injector = injector;
        let spyOnCreateMethodProxy = spy(ProxyUtils, 'createMethodProxy');
        let stubOnGetComponent = stub(MyAspectDefinitionPostProcessor.injector, 'getComponent').returns(instanceOfB);
        let stubOnReflectApply = stub(Reflect, 'apply');
        let stubOnPromiseRace = stub(Promise, 'race').returns(Promise.resolve('resolved'));
        let stubOnNewProceedingJoinPoint = stub(ProceedingJoinPoint.prototype, 'constructor');
        let proceedingJoinPoint = new ProceedingJoinPoint(methodOne, instanceOfA, []);
        // when
        let aroundProxy = MyAspectDefinitionPostProcessor
            .createAroundProxyMethod(methodOne, methodTwo, clazz);
        Reflect.set(A.prototype, 'methodOne', aroundProxy);

        let promiseResult = await instanceOfA.methodOne();

        //  then
        expect(promiseResult).to.be.eq('resolved');
        expect(spyOnCreateMethodProxy.calledWith(methodOne, match.func)).to.be.true;
        expect(stubOnGetComponent.calledWith(clazz)).to.be.true;
        expect(stubOnReflectApply.calledWith(methodTwo, instanceOfB, [proceedingJoinPoint])).to.be.true;
        expect(stubOnPromiseRace.calledOnce).to.be.true;
        // cleanup
        spyOnCreateMethodProxy.restore();
        stubOnGetComponent.restore();
        stubOnReflectApply.restore();
        stubOnPromiseRace.restore();
        stubOnNewProceedingJoinPoint.restore();
    });
});