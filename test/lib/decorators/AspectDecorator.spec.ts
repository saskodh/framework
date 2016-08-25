import {expect} from 'chai';
import {
    Aspect, Before, After, AfterThrowing, AfterReturning,
    Around, AdviceType, ProceedingJoinPoint, AspectUtil, PointcutList
} from "../../../src/lib/decorators/AspectDecorator";
import { stub } from "sinon";
import { ComponentUtil } from "../../../src/lib/decorators/ComponentDecorator";

describe('AspectDecorator', function () {

    it('should add metadata for @Aspect', async function () {
        // given
        @Aspect()
        class A {}

        class B {}

        // when
        let isAspectA = ComponentUtil.isAspect(A);
        let isAspectB = ComponentUtil.isAspect(B);

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
            @Before({classRegex: 'B', methodRegex: 'methodOne' })
            doSomething() { return; }
        }

        // when
        let beforeDataA = AspectUtil.getPointcuts(A.prototype, AdviceType.BEFORE);
        let isAspectB = ComponentUtil.isAspect(B.prototype);

        //  then
        expect(beforeDataA.length).to.be.eq(1);
        expect(beforeDataA[0].pointcutConfig.classRegex).to.be.eql('B');
        expect(beforeDataA[0].pointcutConfig.methodRegex).to.be.eql('methodOne');
        expect(beforeDataA[0].targetMethod).to.be.eq('doSomething');
        expect(isAspectB).to.be.false;
    });

    it('should add metadata for @After', async function () {
        // given
        class B {
            methodOne() { return; }
        }

        @Aspect()
        class A {
            @After({classRegex: /^B$/, methodRegex: 'methodOne' })
            doSomething() { return; }
        }

        // when
        let beforeDataA = AspectUtil.getPointcuts(A.prototype, AdviceType.AFTER);
        let isAspectB = ComponentUtil.isAspect(B.prototype);

        //  then
        expect(beforeDataA.length).to.be.eq(1);
        expect(beforeDataA[0].pointcutConfig.classRegex).to.be.eql(/^B$/);
        expect(beforeDataA[0].pointcutConfig.methodRegex).to.be.eql('methodOne');
        expect(beforeDataA[0].targetMethod).to.be.eq('doSomething');
        expect(isAspectB).to.be.false;
    });

    it('should add metadata for @AfterReturning', async function () {
        // given
        class B {
            methodOne() { return; }
        }

        @Aspect()
        class A {
            @AfterReturning({classRegex: /^B$/, methodRegex: /^methodOne$/ })
            doSomething() { return; }
        }

        // when
        let beforeDataA = AspectUtil.getPointcuts(A.prototype, AdviceType.AFTER_RETURNING);
        let isAspectB = ComponentUtil.isAspect(B.prototype);

        //  then
        expect(beforeDataA.length).to.be.eq(1);
        expect(beforeDataA[0].pointcutConfig.classRegex).to.be.eql(/^B$/);
        expect(beforeDataA[0].pointcutConfig.methodRegex).to.be.eql(/^methodOne$/);
        expect(beforeDataA[0].targetMethod).to.be.eq('doSomething');
        expect(isAspectB).to.be.false;
    });

    it('should add metadata for @AfterThrowing', async function () {
        // given
        class B {
            methodOne() { return; }
        }

        @Aspect()
        class A {
            @AfterThrowing({classRegex: /^B$/, methodRegex: /^methodOne$/ })
            doSomething() { return; }
        }

        // when
        let beforeDataA = AspectUtil.getPointcuts(A.prototype, AdviceType.AFTER_THROWING);
        let isAspectB = ComponentUtil.isAspect(B.prototype);

        //  then
        expect(beforeDataA.length).to.be.eq(1);
        expect(beforeDataA[0].pointcutConfig.classRegex).to.be.eql(/^B$/);
        expect(beforeDataA[0].pointcutConfig.methodRegex).to.be.eql(/^methodOne$/);
        expect(beforeDataA[0].targetMethod).to.be.eq('doSomething');
        expect(isAspectB).to.be.false;
    });

    it('should add metadata for @Around', async function () {
        // given
        class B {
            methodOne() { return; }
        }

        @Aspect()
        class A {
            @Around({classRegex: /^B$/, methodRegex: /^methodOne$/ })
            doSomething() { return; }
        }

        // when
        let beforeDataA = AspectUtil.getPointcuts(A.prototype, AdviceType.AROUND);
        let isAspectB = ComponentUtil.isAspect(B.prototype);

        //  then
        expect(beforeDataA.length).to.be.eq(1);
        expect(beforeDataA[0].pointcutConfig.classRegex).to.be.eql(/^B$/);
        expect(beforeDataA[0].pointcutConfig.methodRegex).to.be.eql(/^methodOne$/);
        expect(beforeDataA[0].targetMethod).to.be.eq('doSomething');
        expect(isAspectB).to.be.false;
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

describe('AspectUtil', function () {

    it('should init the pointcut list', function () {
        // given
        @Aspect()
        class AspectA {}

        // when
        let pointcutList = AspectUtil.initPointcutListDoesntExist(AspectA);

        // then
        expect(pointcutList).to.be.instanceOf(PointcutList);
    });

    it('should return the complete pointcut list', function () {
        // given
        class ClassA {
            methodOne() {} // tslint:disable-line
        }
        @Aspect()
        class AspectA {
            @Before({classRegex: /^ClassA$/, methodRegex: /^methodOne$/ })
            doSomethingBefore() {} // tslint:disable-line

            @After({classRegex: 'ClassA', methodRegex: 'methodOne' })
            doSomethingAfter() {} // tslint:disable-line
        }

        // when
        let pointcutList = AspectUtil.getPointcutList(AspectA.prototype);

        // then
        expect(pointcutList).to.be.instanceOf(PointcutList);
    });

    it('should return the pointcuts for the given advice type', function () {
        // given
        let localPointcutConfig = { classRegex: /^ClassA$/, methodRegex: /^methodOne$/ };
        class ClassA {
            methodOne() {} // tslint:disable-line
        }
        @Aspect()
        class AspectA {
            @Before(localPointcutConfig)
            doSomethingBefore() {} // tslint:disable-line
        }

        // when
        let pointcutsBefore = AspectUtil.getPointcuts(AspectA.prototype, 'before');
        let pointcutsAfter = AspectUtil.getPointcuts(AspectA.prototype, 'after');
        let pointcutsAfterEmpty = AspectUtil.getPointcuts(AspectA, 'after');

        // then
        expect(pointcutsBefore.length).to.be.eq(1);
        expect(pointcutsBefore[0].pointcutConfig).to.be.eq(localPointcutConfig);
        expect(pointcutsBefore[0].targetMethod).to.be.eq('doSomethingBefore');
        expect(pointcutsAfter.length).to.be.eq(0);
        expect(pointcutsAfterEmpty.length).to.be.eq(0);
    });
});