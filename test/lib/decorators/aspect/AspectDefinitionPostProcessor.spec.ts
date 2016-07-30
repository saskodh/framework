import {expect} from 'chai';
import {
    Aspect, Before, After, AdviceType, AfterReturning, AfterThrowing, Around, Pointcut, ProceedingJoinPoint,
    PointcutList
} from "../../../../src/lib/decorators/AspectDecorator";
import { stub, spy, match } from "sinon";
import {AspectDefinitionPostProcessor} from "../../../../src/lib/decorators/aspect/AspectDefinitionPostProcessor";
import {ProxyUtils} from "../../../../src/lib/helpers/ProxyUtils";
require("reflect-metadata");

describe('AspectDecorator', function () {
    let aspectDefinitionPostProcessor;
    let MyAspectDefinitionPostProcessor;
    let appContext;
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
            @Before(ClassA, 'methodOne')
            doSomethingBefore() { return; }
        }
        @Aspect()
        class AspectB {
            @After(ClassA, 'methodTwo')
            doSomethingAfter() { return; }
        }
        let aspects = [AspectA, AspectB];
        let stubOnGetAllAdviceTypes = stub(AdviceType, 'getAllAdviceTypes').returns(['before', 'after']);
        let stubOnCreateProxyMethod =
            stub(aspectDefinitionPostProcessor, 'createProxyMethod').returns('proxied method');
        let spyOnReflectSet = spy(Reflect, 'set');

        let pointcut1 = new Pointcut(ClassA, 'methodOne', 'doSomethingBefore');
        let pointCutList1 = new PointcutList();
        pointCutList1.pointcuts.push(pointcut1);

        let pointcut2 = new Pointcut(ClassA, 'methodTwo', 'doSomethingAfter');
        let pointCutList2 = new PointcutList();
        pointCutList2.pointcuts.push(pointcut2);

        let stubOnGetConfigurationData = stub(aspectDefinitionPostProcessor, 'getConfigurationData');
        stubOnGetConfigurationData.withArgs(AspectA, 'before')
            .returns(pointCutList1);
        stubOnGetConfigurationData.withArgs(AspectA, 'after')
            .returns(new PointcutList());
        stubOnGetConfigurationData.withArgs(AspectB, 'before')
            .returns(new PointcutList());
        stubOnGetConfigurationData.withArgs(AspectB, 'after')
            .returns(pointCutList2);

        // when
        aspectDefinitionPostProcessor.createAspects(aspects, appContext);

        //  then
        expect(stubOnGetAllAdviceTypes.called).to.be.true;
        expect(stubOnCreateProxyMethod.called).to.be.true;
        expect(stubOnGetConfigurationData.calledWith(AspectA, 'before')).to.be.true;
        expect(stubOnGetConfigurationData.calledWith(AspectA, 'after')).to.be.true;
        expect(stubOnGetConfigurationData.calledWith(AspectB, 'before')).to.be.true;
        expect(stubOnGetConfigurationData.calledWith(AspectB, 'after')).to.be.true;
        expect(spyOnReflectSet.calledWith(ClassA.prototype, 'methodOne', 'proxied method')).to.be.true;
        expect(spyOnReflectSet.calledWith(ClassA.prototype, 'methodTwo', 'proxied method')).to.be.true;
        // cleanup
        stubOnGetAllAdviceTypes.restore();
        stubOnCreateProxyMethod.restore();
        spyOnReflectSet.restore();
        stubOnGetConfigurationData.restore();
    });

    it('should return configuration data', async function () {
        // given
        class ClassA {
            methodOne(arg) { return true; }
            methodTwo(arg) { return false; }
            methodThree(arg) { return false; }
            methodFour(arg) { return false; }
            methodFive(arg) { return false; }
        }
        @Aspect()
        class AspectA {
            @Before(ClassA, 'methodOne')
            doSomethingBefore() { return; }

            @After(ClassA, 'methodTwo')
            doSomethingAfter() { return; }

            @AfterReturning(ClassA, 'methodThree')
            doSomethingAfterReturning() { return; }

            @AfterThrowing(ClassA, 'methodFour')
            doSomethingAfterThrowing() { return; }

            @Around(ClassA, 'methodFive')
            doSomethingAround() { return; }
        }
        @Aspect()
        class AspectB {}
        let aspects = ['before', 'after', 'after_returning', 'after_throwing', 'around'];

        // when
        let aspectABefore = MyAspectDefinitionPostProcessor.getConfigurationData(AspectA, aspects[0]);
        let aspectAAfter = MyAspectDefinitionPostProcessor.getConfigurationData(AspectA, aspects[1]);
        let aspectAAfterReturning = MyAspectDefinitionPostProcessor.getConfigurationData(AspectA, aspects[2]);
        let aspectAAfterThrowing = MyAspectDefinitionPostProcessor.getConfigurationData(AspectA, aspects[3]);
        let aspectAAround = MyAspectDefinitionPostProcessor.getConfigurationData(AspectA, aspects[4]);
        let aspectBBefore = MyAspectDefinitionPostProcessor.getConfigurationData(AspectB, aspects[0]);


        //  then
        expect(aspectABefore.pointcuts.length).to.be.eq(1);
        expect(aspectABefore.pointcuts[0]).to.be.instanceOf(Pointcut);
        expect(aspectABefore.pointcuts[0].clazz).to.be.eql(ClassA);
        expect(aspectABefore.pointcuts[0].originalMethod).to.be.eq('methodOne');
        expect(aspectABefore.pointcuts[0].targetMethod).to.be.eq('doSomethingBefore');

        expect(aspectAAfter.pointcuts.length).to.be.eq(1);
        expect(aspectAAfter.pointcuts[0]).to.be.instanceOf(Pointcut);
        expect(aspectAAfter.pointcuts[0].clazz).to.be.eql(ClassA);
        expect(aspectAAfter.pointcuts[0].originalMethod).to.be.eq('methodTwo');
        expect(aspectAAfter.pointcuts[0].targetMethod).to.be.eq('doSomethingAfter');

        expect(aspectAAfterReturning.pointcuts.length).to.be.eq(1);
        expect(aspectAAfterReturning.pointcuts[0]).to.be.instanceOf(Pointcut);
        expect(aspectAAfterReturning.pointcuts[0].clazz).to.be.eql(ClassA);
        expect(aspectAAfterReturning.pointcuts[0].originalMethod).to.be.eq('methodThree');
        expect(aspectAAfterReturning.pointcuts[0].targetMethod).to.be.eq('doSomethingAfterReturning');

        expect(aspectAAfterThrowing.pointcuts.length).to.be.eq(1);
        expect(aspectAAfterThrowing.pointcuts[0]).to.be.instanceOf(Pointcut);
        expect(aspectAAfterThrowing.pointcuts[0].clazz).to.be.eql(ClassA);
        expect(aspectAAfterThrowing.pointcuts[0].originalMethod).to.be.eq('methodFour');
        expect(aspectAAfterThrowing.pointcuts[0].targetMethod).to.be.eq('doSomethingAfterThrowing');

        expect(aspectAAround.pointcuts.length).to.be.eq(1);
        expect(aspectAAround.pointcuts[0]).to.be.instanceOf(Pointcut);
        expect(aspectAAround.pointcuts[0].clazz).to.be.eql(ClassA);
        expect(aspectAAround.pointcuts[0].originalMethod).to.be.eq('methodFive');
        expect(aspectAAround.pointcuts[0].targetMethod).to.be.eq('doSomethingAround');

        expect(aspectBBefore.pointcuts).to.be.empty;
    });

    it('should create proxy method', async function () {
        // given
        let originalMethod = 'originalMethod';
        let targetMethod = 'targetMethod';
        let aspectConstructor =  'aspectConstructor';
        let appContext =  'appContext';
        let advices = ['before', 'after', 'after_returning', 'after_throwing', 'around'];
        let stubOnCreateBeforeProxyMethod = stub(aspectDefinitionPostProcessor, 'createBeforeProxyMethod')
            .returns('before');
        let stubOnCreateAfterProxyMethod = stub(aspectDefinitionPostProcessor, 'createAfterProxyMethod')
            .returns('after');
        let stubOnCreateAfterReturningProxyMethod =
            stub(aspectDefinitionPostProcessor, 'createAfterReturningProxyMethod').returns('after_returning');
        let stubOnCreateAfterThrowingProxyMethod = stub(aspectDefinitionPostProcessor, 'createAfterThrowingProxyMethod')
            .returns('after_throwing');
        let stubOnCreateAroundProxyMethod = stub(aspectDefinitionPostProcessor, 'createAroundProxyMethod')
            .returns('around');

        // when
        let beforeProxy = MyAspectDefinitionPostProcessor
            .createProxyMethod(originalMethod, targetMethod, aspectConstructor, appContext, advices[0]);
        let afterProxy = MyAspectDefinitionPostProcessor
            .createProxyMethod(originalMethod, targetMethod, aspectConstructor, appContext, advices[1]);
        let afterReturningProxy = MyAspectDefinitionPostProcessor
            .createProxyMethod(originalMethod, targetMethod, aspectConstructor, appContext, advices[2]);
        let afterThrowingProxy = MyAspectDefinitionPostProcessor
            .createProxyMethod(originalMethod, targetMethod, aspectConstructor, appContext, advices[3]);
        let aroundProxy = MyAspectDefinitionPostProcessor
            .createProxyMethod(originalMethod, targetMethod, aspectConstructor, appContext, advices[4]);
        let undefinedProxy = MyAspectDefinitionPostProcessor
            .createProxyMethod(originalMethod, targetMethod, aspectConstructor, appContext, 'unknownAdvice');

        //  then
        expect(stubOnCreateBeforeProxyMethod
            .calledWith(originalMethod, targetMethod, aspectConstructor, appContext)).to.be.true;
        expect(stubOnCreateAfterProxyMethod
            .calledWith(originalMethod, targetMethod, aspectConstructor, appContext)).to.be.true;
        expect(stubOnCreateAfterReturningProxyMethod
            .calledWith(originalMethod, targetMethod, aspectConstructor, appContext)).to.be.true;
        expect(stubOnCreateAfterThrowingProxyMethod
            .calledWith(originalMethod, targetMethod, aspectConstructor, appContext)).to.be.true;
        expect(stubOnCreateAroundProxyMethod
            .calledWith(originalMethod, targetMethod, aspectConstructor, appContext)).to.be.true;
        expect(beforeProxy).to.be.eq('before');
        expect(afterProxy).to.be.eq('after');
        expect(afterReturningProxy).to.be.eq('after_returning');
        expect(afterThrowingProxy).to.be.eq('after_throwing');
        expect(aroundProxy).to.be.eq('around');
        expect(undefinedProxy).to.be.undefined;
        // cleanup
        stubOnCreateBeforeProxyMethod.restore();
        stubOnCreateAfterProxyMethod.restore();
        stubOnCreateAfterReturningProxyMethod.restore();
        stubOnCreateAfterThrowingProxyMethod.restore();
        stubOnCreateAroundProxyMethod.restore();
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
        let appContext =  {
            getComponent: () => { return; }
        };
        let spyOnCreateMethodProxy = spy(ProxyUtils, 'createMethodProxy');
        let stubOnGetComponent = stub(appContext, 'getComponent').returns(instanceOfB);
        let stubOnReflectApply = stub(Reflect, 'apply').returns(Promise.resolve('resolved'));
        let stubOnPromiseRace = stub(Promise, 'race').returns(Promise.resolve('resolved'));

        // when
        let beforeProxy = MyAspectDefinitionPostProcessor
            .createBeforeProxyMethod(methodOne, methodTwo, clazz, appContext);
        Reflect.set(A.prototype, 'methodOne', beforeProxy);
        let promiseResult = await instanceOfA.methodOne();

        //  then
        expect(spyOnCreateMethodProxy.calledWith(methodOne, match.func)).to.be.true;
        expect(spyOnCreateMethodProxy.calledWith(methodTwo, match.func)).to.be.true;
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
        let appContext =  {
            getComponent: () => { return; }
        };
        let spyOnCreateMethodProxy = spy(ProxyUtils, 'createMethodProxy');
        let stubOnGetComponent = stub(appContext, 'getComponent').returns(instanceOfB);
        let stubOnReflectApply = stub(Reflect, 'apply');
        let stubOnPromiseRace = stub(Promise, 'race').returns(Promise.resolve('resolved'));

        // when
        let afterProxy = MyAspectDefinitionPostProcessor
            .createAfterProxyMethod(methodOne, methodTwo, clazz, appContext);
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
        expect(spyOnCreateMethodProxy.calledWith(methodTwo, match.func)).to.be.true;
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
        let appContext =  {
            getComponent: () => { return; }
        };
        let error = new Error('new error');
        let spyOnCreateMethodProxy = spy(ProxyUtils, 'createMethodProxy');
        let stubOnGetComponent = stub(appContext, 'getComponent').returns(instanceOfB);
        let stubOnReflectApply = stub(Reflect, 'apply');
        let stubOnPromiseRace = stub(Promise, 'race').throws(error);

        // when
        let afterProxy = MyAspectDefinitionPostProcessor
            .createAfterProxyMethod(methodOne, methodTwo, clazz, appContext);
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
        expect(spyOnCreateMethodProxy.calledWith(methodTwo, match.func)).to.be.true;
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
        let appContext =  {
            getComponent: () => { return; }
        };
        let spyOnCreateMethodProxy = spy(ProxyUtils, 'createMethodProxy');
        let stubOnGetComponent = stub(appContext, 'getComponent').returns(instanceOfB);
        let stubOnReflectApply = stub(Reflect, 'apply');
        let stubOnPromiseRace = stub(Promise, 'race').returns(Promise.resolve('resolved'));

        // when
        let afterReturningProxy = MyAspectDefinitionPostProcessor
            .createAfterReturningProxyMethod(methodOne, methodTwo, clazz, appContext);
        Reflect.set(A.prototype, 'methodOne', afterReturningProxy);
        let promiseResult = await instanceOfA.methodOne();

        //  then
        expect(spyOnCreateMethodProxy.calledWith(methodOne, match.func)).to.be.true;
        expect(spyOnCreateMethodProxy.calledWith(methodTwo, match.func)).to.be.true;
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
        let appContext =  {
            getComponent: () => { return; }
        };
        let error = new Error('new error');
        let spyOnCreateMethodProxy = spy(ProxyUtils, 'createMethodProxy');
        let stubOnGetComponent = stub(appContext, 'getComponent').returns(instanceOfB);
        let stubOnReflectApply = stub(Reflect, 'apply');
        stubOnReflectApply.withArgs(methodOne, instanceOfA, []).returns('error');
        stubOnReflectApply.withArgs(methodTwo, instanceOfB, [error]).returns('after throwing executed');
        let stubOnPromiseRace = stub(Promise, 'race').throws(error);

        // when
        let afterThrowingProxy = MyAspectDefinitionPostProcessor
            .createAfterThrowingProxyMethod(methodOne, methodTwo, clazz, appContext);
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
        expect(spyOnCreateMethodProxy.calledWith(methodTwo, match.func)).to.be.true;
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
        let appContext =  {
            getComponent: () => { return; }
        };
        let spyOnCreateMethodProxy = spy(ProxyUtils, 'createMethodProxy');
        let stubOnGetComponent = stub(appContext, 'getComponent').returns(instanceOfB);
        let stubOnReflectApply = stub(Reflect, 'apply');
        let stubOnPromiseRace = stub(Promise, 'race').returns(Promise.resolve('resolved'));
        let stubOnNewProceedingJoinPoint = stub(ProceedingJoinPoint.prototype, 'constructor');
        let proceedingJoinPoint = new ProceedingJoinPoint(methodOne, instanceOfA, []);
        // when
        let aroundProxy = MyAspectDefinitionPostProcessor
            .createAroundProxyMethod(methodOne, methodTwo, clazz, appContext);
        Reflect.set(A.prototype, 'methodOne', aroundProxy);

        let promiseResult = await instanceOfA.methodOne();

        //  then
        expect(promiseResult).to.be.eq('resolved');
        expect(spyOnCreateMethodProxy.calledWith(methodOne, match.func)).to.be.true;
        expect(spyOnCreateMethodProxy.calledWith(methodTwo, match.func)).to.be.true;
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