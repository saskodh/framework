import {expect} from 'chai';
import {
    Aspect, Before, After, AfterThrowing, AfterReturning,
    Around, AspectUtil, PointcutList, AdviceType, ProceedingJoinPoint
} from "../../../src/lib/decorators/AspectDecorator";
import { stub } from "sinon";

describe('AspectDecorator', function () {

    it('should add metadata for @Aspect', async function () {
        // given
        @Aspect()
        class A {}

        class B {}

        // when
        let isAspectA = AspectUtil.isAspect(A);
        let isAspectB = AspectUtil.isAspect(B);

        //  then
        expect(isAspectA).to.be.true;
        expect(isAspectB).to.be.false;
    });

    it('should add metadata for @Before', async function () {
        // given
        class B {
            methodOne() { return; }
        }

        @Aspect()
        class A {
            @Before(B, 'methodOne')
            doSomething() { return; }
        }

        // when
        let hasBeforeA = AspectUtil.hasBefore(A.prototype);
        let hasBeforeB = AspectUtil.hasBefore(B.prototype);
        let beforeDataA = AspectUtil.getBeforePointcuts(A.prototype);

        //  then
        expect(hasBeforeA).to.be.true;
        expect(hasBeforeB).to.be.false;
        expect(beforeDataA).to.be.instanceOf(PointcutList);
        expect(beforeDataA.pointcuts.length).to.be.eq(1);
        expect(beforeDataA.pointcuts[0].clazz).to.be.eq(B);
        expect(beforeDataA.pointcuts[0].originalMethod).to.be.eq('methodOne');
        expect(beforeDataA.pointcuts[0].targetMethod).to.be.eq('doSomething');

    });

    it('should add metadata for @After', async function () {
        // given
        class B {
            methodOne() { return; }
        }

        @Aspect()
        class A {
            @After(B, 'methodOne')
            doSomething() { return; }
        }

        // when
        let hasAfterA = AspectUtil.hasAfter(A.prototype);
        let hasAfterB = AspectUtil.hasAfter(B.prototype);
        let afterDataA = AspectUtil.getAfterPointcuts(A.prototype);

        //  then
        expect(hasAfterA).to.be.true;
        expect(hasAfterB).to.be.false;
        expect(afterDataA).to.be.instanceOf(PointcutList);
        expect(afterDataA.pointcuts.length).to.be.eq(1);
        expect(afterDataA.pointcuts[0].clazz).to.be.eq(B);
        expect(afterDataA.pointcuts[0].originalMethod).to.be.eq('methodOne');
        expect(afterDataA.pointcuts[0].targetMethod).to.be.eq('doSomething');

    });

    it('should add metadata for @AfterReturning', async function () {
        // given
        class B {
            methodOne() { return; }
        }

        @Aspect()
        class A {
            @AfterReturning(B, 'methodOne')
            doSomething() { return; }
        }

        // when
        let hasAfterReturningA = AspectUtil.hasAfterReturning(A.prototype);
        let hasAfterReturningB = AspectUtil.hasAfterReturning(B.prototype);
        let afterReturningDataA = AspectUtil.getAfterReturningPointcuts(A.prototype);

        //  then
        expect(hasAfterReturningA).to.be.true;
        expect(hasAfterReturningB).to.be.false;
        expect(afterReturningDataA).to.be.instanceOf(PointcutList);
        expect(afterReturningDataA.pointcuts.length).to.be.eq(1);
        expect(afterReturningDataA.pointcuts[0].clazz).to.be.eq(B);
        expect(afterReturningDataA.pointcuts[0].originalMethod).to.be.eq('methodOne');
        expect(afterReturningDataA.pointcuts[0].targetMethod).to.be.eq('doSomething');

    });

    it('should add metadata for @AfterThrowing', async function () {
        // given
        class B {
            methodOne() { return; }
        }

        @Aspect()
        class A {
            @AfterThrowing(B, 'methodOne')
            doSomething() { return; }
        }

        // when
        let hasAfterThrowingA = AspectUtil.hasAfterThrowing(A.prototype);
        let hasAfterThrowingB = AspectUtil.hasAfterThrowing(B.prototype);
        let afterThrowingDataA = AspectUtil.getAfterThrowingPointcuts(A.prototype);

        //  then
        expect(hasAfterThrowingA).to.be.true;
        expect(hasAfterThrowingB).to.be.false;
        expect(afterThrowingDataA).to.be.instanceOf(PointcutList);
        expect(afterThrowingDataA.pointcuts.length).to.be.eq(1);
        expect(afterThrowingDataA.pointcuts[0].clazz).to.be.eq(B);
        expect(afterThrowingDataA.pointcuts[0].originalMethod).to.be.eq('methodOne');
        expect(afterThrowingDataA.pointcuts[0].targetMethod).to.be.eq('doSomething');

    });

    it('should add metadata for @Around', async function () {
        // given
        class B {
            methodOne() { return; }
        }

        @Aspect()
        class A {
            @Around(B, 'methodOne')
            doSomething() { return; }
        }

        // when
        let hasAroundA = AspectUtil.hasAround(A.prototype);
        let hasAroundB = AspectUtil.hasAround(B.prototype);
        let aroungDataA = AspectUtil.getAroundPointcuts(A.prototype);

        //  then
        expect(hasAroundA).to.be.true;
        expect(hasAroundB).to.be.false;
        expect(aroungDataA).to.be.instanceOf(PointcutList);
        expect(aroungDataA.pointcuts.length).to.be.eq(1);
        expect(aroungDataA.pointcuts[0].clazz).to.be.eq(B);
        expect(aroungDataA.pointcuts[0].originalMethod).to.be.eq('methodOne');
        expect(aroungDataA.pointcuts[0].targetMethod).to.be.eq('doSomething');

    });

    it('should return all advice types', async function () {
        // given / when
        let adviceTypes = AdviceType.getAllAdviceTypes();

        //  then
        expect(adviceTypes).to.include.members(['before', 'after', 'after_returning', 'after_throwing', 'around']);
    });

    it('should create ProceedingJoinPoint instance', async function () {
        // given
        class A {
            private property;
            constructor () {
                this.property = 'value';
            }

            methodOne() {
                return this.property;
            }
        }
        let instanceOfA = new A();
        let method = instanceOfA['methodOne'];

        // when
        let proceedingJoinPoint = new ProceedingJoinPoint(method, instanceOfA, []);
        let publicProceedingJoinPoint = (<any> proceedingJoinPoint);

        //  then
        expect(publicProceedingJoinPoint.methodRef).to.be.eql(method);
        expect(publicProceedingJoinPoint.thisArg).to.be.eql(instanceOfA);
        expect(publicProceedingJoinPoint.args).to.be.eql([]);
    });

    it('should invoke original method with Reflect', async function () {
        // given
        class A {
            private property;
            constructor () {
                this.property = 'value';
            }

            methodOne() {
                return this.property;
            }
        }
        let instanceOfA = new A();
        let method = instanceOfA['methodOne'];
        let proceedingJoinPoint = new ProceedingJoinPoint(method, instanceOfA, []);
        let stubOnReflectApply = stub(Reflect, 'apply').returns(Promise.resolve('resolved'));

        // when
        let result = await proceedingJoinPoint.proceed();

        //  then
        expect(result).to.be.eq('resolved');
        expect(stubOnReflectApply.calledWith(method, instanceOfA, [])).to.be.true;

        // cleanup
        stubOnReflectApply.restore();
    });
});