import {expect} from 'chai';
import {
    Aspect, Before, After, AfterReturning, AfterThrowing, Around, ProceedingJoinPoint
} from "../../../../src/lib/decorators/AspectDecorator";
import { spy, assert } from "sinon";
import { Component } from "../../../../src/lib/decorators/ComponentDecorator";
import { Inject } from "../../../../src/lib/decorators/InjectionDecorators";
import { Configuration, ConfigurationUtil } from "../../../../src/lib/decorators/ConfigurationDecorator";
import { ActiveProfiles } from "../../../../src/lib/decorators/ProfileDecorators";
import { ApplicationContext } from "../../../../src/lib/di/ApplicationContext";
import { Order } from "../../../../src/lib/decorators/OrderDecorator";
require("reflect-metadata");

describe('AspectDefinitionPostProcessor Integration Test', function () {

    let appContext: ApplicationContext;
    let localAppContext;

    @ActiveProfiles('dev')
    @Configuration()
    class AppConfig {}


    @Component()
    class ComponentA {
        spyMethod() {} // tslint:disable-line
    }

    @Component()
    class ClassA {
        @Inject()
        public componentAInstance: ComponentA;

        methodOne() {
            this.componentAInstance.spyMethod();
        }

        methodTwo() {
            this.componentAInstance.spyMethod();
            throw new Error('Test error!');
        }
    }

    @Order(1)
    @Aspect()
    class AspectA {
        @Inject()
        public componentAInstance: ComponentA;

        @Before({ classRegex: /^ClassA$/, methodRegex: /^methodOne$/ })
        doSomethingBefore() {
            this.componentAInstance.spyMethod();
        }

        @Before({ classRegex: /^ClassA$/, methodRegex: /^methodOne$/ })
        doSomethingElseBefore() {
            this.componentAInstance.spyMethod();
        }

        @After({ classRegex: /^ClassA$/, methodRegex: /^methodOne$/ })
        @After({ classRegex: /^ClassA$/, methodRegex: /^methodOne$/ })
        doSomethingAfter() {
            this.componentAInstance.spyMethod();
        }

        @Before({ classRegex: /^ClassA$/, methodRegex: /^methodOne$/ })
        doEverythingElseBefore() {
            this.componentAInstance.spyMethod();
        }
    }

    @Order(2)
    @Aspect()
    class AspectB {
        @Inject()
        public componentAInstance: ComponentA;

        @Before({ classRegex: /^ClassA$/, methodRegex: /^methodOne$/ })
        doBefore() {
            this.componentAInstance.spyMethod();
        }

        @AfterReturning({ classRegex: /^ClassA$/, methodRegex: /^methodOne$/ })
        doAfterReturning() {
            this.componentAInstance.spyMethod();
        }

        @Around({ classRegex: /^ClassA$/, methodRegex: /^methodOne$/ })
        doAround(proceedingJoinPoint: ProceedingJoinPoint) {
            this.componentAInstance.spyMethod();
            proceedingJoinPoint.proceed();
        }
    }

    @Order(3)
    @Aspect()
    class AspectC {
        @Inject()
        public componentAInstance: ComponentA;

        @Before({ classRegex: 'ClassA', methodRegex: 'methodTwo' })
        doBefore() {
            this.componentAInstance.spyMethod();
        }

        @AfterThrowing({ classRegex: 'ClassA', methodRegex: 'methodTwo' })
        doAfterThrowing() {
            this.componentAInstance.spyMethod();
        }
    }

    beforeEach(() => {
        appContext = new ApplicationContext(AppConfig);
        localAppContext = <any> appContext;
        localAppContext.configurationData.componentFactory.components.push(ComponentA);
        localAppContext.configurationData.componentFactory.components.push(ClassA);
        localAppContext.configurationData.componentFactory.components.push(AspectA);
        localAppContext.configurationData.componentFactory.components.push(AspectB);
        localAppContext.configurationData.componentFactory.components.push(AspectC);
    });

    afterEach(() => {
        let configData = ConfigurationUtil.getConfigurationData(AppConfig);
        configData.componentFactory.components = [];
        configData.componentDefinitionPostProcessorFactory.components = [];
    });

    it('should call advices in correct order', async function () {
        // given
        let spyOnMethodOne = spy(ClassA.prototype, 'methodOne');
        let spyOnDoSomethingBefore = spy(AspectA.prototype, 'doSomethingBefore');
        let spyOnDoSomethingElseBefore = spy(AspectA.prototype, 'doSomethingElseBefore');
        let spyOnDoEverythingElseBefore = spy(AspectA.prototype, 'doEverythingElseBefore');
        let spyOnDoSomethingAfter = spy(AspectA.prototype, 'doSomethingAfter');

        let spyOnDoBefore = spy(AspectB.prototype, 'doBefore');
        let spyOnDoAfterReturning = spy(AspectB.prototype, 'doAfterReturning');
        let spyOnDoAround = spy(AspectB.prototype, 'doAround');

        let spyOnSpyMethod = spy(ComponentA.prototype, 'spyMethod');

        // when
        await appContext.start();
        let instanceClassA: any = appContext.getComponent(ClassA);
        await instanceClassA.methodOne();

        //  then
        assert.callOrder(spyOnDoEverythingElseBefore, spyOnDoSomethingElseBefore, spyOnDoSomethingBefore, spyOnDoBefore,
            spyOnDoAround, spyOnMethodOne, spyOnDoAfterReturning, spyOnDoSomethingAfter,
            spyOnDoSomethingAfter);
        expect(spyOnSpyMethod.callCount).to.be.eq(9);

        // cleanup
        spyOnMethodOne.restore();
        spyOnDoSomethingBefore.restore();
        spyOnDoSomethingElseBefore.restore();
        spyOnDoEverythingElseBefore.restore();
        spyOnDoSomethingAfter.restore();
        spyOnDoBefore.restore();
        spyOnDoAfterReturning.restore();
        spyOnDoAround.restore();
        spyOnSpyMethod.restore();
    });

    it('should call advices in correct order when throwing', async function () {
        // given
        let spyOnDoBefore = spy(AspectC.prototype, 'doBefore');
        let spyOnDoAfterThrowing = spy(AspectC.prototype, 'doAfterThrowing');

        let spyOnSpyMethod = spy(ComponentA.prototype, 'spyMethod');

        // when
        await appContext.start();
        let instanceClassA: any = appContext.getComponent(ClassA);

        //  then
        let hasThrown = false;
        try {
            await instanceClassA.methodTwo();
        } catch (err) {
            hasThrown = true;
        }

        assert.callOrder(spyOnDoBefore, spyOnDoAfterThrowing);
        expect(hasThrown).to.be.true;
        expect(spyOnSpyMethod.callCount).to.be.eq(3);

        // cleanup
        spyOnDoBefore.restore();
        spyOnDoAfterThrowing.restore();
        spyOnSpyMethod.restore();
    });
});