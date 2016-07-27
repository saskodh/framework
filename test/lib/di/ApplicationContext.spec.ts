import { expect } from "chai";
import { ApplicationContext, ApplicationContextState } from "../../../src/lib/di/ApplicationContext";
import {
    Configuration, ConfigurationUtil,
    ConfigurationData
} from "../../../src/lib/decorators/ConfigurationDecorator";
import { Component, ComponentUtil, Profile } from "../../../src/lib/decorators/ComponentDecorator";
import { Controller } from "../../../src/lib/decorators/ControllerDecorator";
import { Qualifier } from "../../../src/lib/decorators/QualifierDecorator";
import { Router } from "express";
import { Injector } from "../../../src/lib/di/Injector";
import { Dispatcher } from "../../../src/lib/dispatcher/Dispatcher";
import { spy, stub, match } from "sinon";
import { ProcessHandler } from "../../../src/lib/helpers/ProcessHandler";
import {
    ComponentDefinitionPostProcessor,
    IComponentDefinitionPostProcessor
} from "../../../src/lib/processors/ComponentDefinitionPostProcessor";
import { IComponentPostProcessor } from "../../../src/lib/processors/ComponentPostProcessor";
import { Order } from "../../../src/lib/decorators/OrderDecorator";

describe('ApplicationContext', function () {

    let appContext: ApplicationContext;
    let localAppContext;
    const token = Symbol('token');

    @Qualifier(token)
    @Component()
    class ComponentClassA {}

    @Qualifier(token)
    @Component()
    class ComponentClassB {}

    @Profile('dev')
    @Controller()
    class ControllerClassA {}

    @Order(2)
    @ComponentDefinitionPostProcessor()
    class DefinitionPostProcessorClassA implements  IComponentDefinitionPostProcessor {
        postProcessDefinition(componentConstructor) { /* console.log("Definition2");*/ };
    }

    @Order(3)
    @ComponentDefinitionPostProcessor()
    class DefinitionPostProcessorClassB implements  IComponentDefinitionPostProcessor {
        postProcessDefinition(componentConstructor) { /* console.log("Definition1");*/ };
    }

    @ComponentDefinitionPostProcessor()
    class PostProcessorClassA implements  IComponentPostProcessor {
        postProcessBeforeInit(componentConstructor) {/* console.log("postprocessbefore");*/ };
        postProcessAfterInit(componentConstructor) {/* console.log("postprocessafter");*/ };
    }

    @Configuration()
    class AppConfig {}

    ConfigurationUtil.getConfigurationData(AppConfig).componentFactory.components.push(ComponentClassA);
    ConfigurationUtil.getConfigurationData(AppConfig).componentFactory.components.push(ComponentClassB);
    ConfigurationUtil.getConfigurationData(AppConfig).componentFactory.components.push(ControllerClassA);

    ConfigurationUtil.getConfigurationData(AppConfig).componentDefinitionPostProcessorFactory.components
        .push(DefinitionPostProcessorClassA);
    ConfigurationUtil.getConfigurationData(AppConfig).componentDefinitionPostProcessorFactory.components
        .push(DefinitionPostProcessorClassB);
    ConfigurationUtil.getConfigurationData(AppConfig).componentPostProcessorFactory.components
        .push(PostProcessorClassA);

    ConfigurationUtil.getConfigurationData(AppConfig).properties.set('application.profiles.active', 'dev');

    beforeEach(() => {
        appContext = new ApplicationContext(AppConfig);
        localAppContext = <any> appContext;
    });

    it('should initialize properly', function () {
        // given
        let spyOnLoadAllProperties = spy(ConfigurationData.prototype, 'loadAllProperties');
        let spyOnLoadAllComponents = spy(ConfigurationData.prototype, 'loadAllComponents');

        // when
        localAppContext = <any> new ApplicationContext(AppConfig);

        // then
        expect(localAppContext.state).to.be.eq(ApplicationContextState.NOT_INITIALIZED);
        expect(localAppContext.injector).to.be.instanceOf(Injector);
        expect(localAppContext.dispatcher).to.be.instanceOf(Dispatcher);
        expect(localAppContext.configurationData).to.be.instanceOf(ConfigurationData);
        expect(spyOnLoadAllProperties.called).to.be.true;
        expect(spyOnLoadAllComponents.called).to.be.true;

        spyOnLoadAllProperties.restore();
        spyOnLoadAllProperties.restore();
    });

    it('should throw error if appContext.start() is not called first', function () {
        // given / when / then
        expect(appContext.getComponent.bind(ComponentClassA)).to.throw(Error);
        expect(appContext.getComponentWithToken.bind(ComponentClassA)).to.throw(Error);
        expect(appContext.getComponentsWithToken.bind(ComponentClassA)).to.throw(Error);
        expect(appContext.getRouter.bind).to.throw(Error);
    });

    it('should destroy appContext', async function () {
        // given
        await appContext.start();
        let spyOnExecutePreDestruction = spy(appContext, 'executePreDestruction');

        // when
        await appContext.destroy();

        // / then
        expect(localAppContext.state).to.be.eq(ApplicationContextState.NOT_INITIALIZED);
        expect(localAppContext.injector).to.be.null;
        expect(localAppContext.dispatcher).to.be.null;
        expect(spyOnExecutePreDestruction.called).to.be.true;
    });

    it('should register exit hook', async function () {
        // given
        let spyOnDestroy = spy(appContext, 'destroy');
        let processHandler = ProcessHandler.getInstance();
        let spyOnRegisterOnExitListener = stub(processHandler, 'registerOnExitListener').returns('unRegisterCallback');

        // when
        appContext.registerExitHook();
        let exitListener = spyOnRegisterOnExitListener.args[0][0];
        exitListener();

        // / then
        expect(spyOnDestroy.called).to.be.true;
        expect(spyOnRegisterOnExitListener.calledWith(match.func)).to.be.true;
        expect(localAppContext.unRegisterExitListenerCallback).to.be.eq('unRegisterCallback');

        // cleanup
        spyOnRegisterOnExitListener.restore();
    });

    it('should throw context already initialized error if start is called more than once', async function () {
        // given
        await appContext.start();

        // when / then
        expect(appContext.start.bind).to.throw(Error);
    });

    it('should return Component with class token', async function () {
        // given
        await appContext.start();
        let spyOnGetComponent = spy(localAppContext.injector, 'getComponent');

        // when
        let componentClassA = appContext.getComponent(ComponentClassA);
        let componentClassB = appContext.getComponent(ComponentClassB);
        let controllerClassA = appContext.getComponent(ControllerClassA);
        let definitionPostProcessorClassA = appContext.getComponent(DefinitionPostProcessorClassA);
        let definitionPostProcessorClassB = appContext.getComponent(DefinitionPostProcessorClassB);
        let postProcessorClassA = appContext.getComponent(PostProcessorClassA);

        // then
        expect(spyOnGetComponent.calledWith(ComponentUtil.getClassToken(ComponentClassA))).to.be.true;
        expect(spyOnGetComponent.calledWith(ComponentUtil.getClassToken(ComponentClassB))).to.be.true;
        expect(spyOnGetComponent.calledWith(ComponentUtil.getClassToken(ControllerClassA))).to.be.true;
        expect(spyOnGetComponent.calledWith(ComponentUtil.getClassToken(DefinitionPostProcessorClassA))).to.be.true;
        expect(spyOnGetComponent.calledWith(ComponentUtil.getClassToken(DefinitionPostProcessorClassB))).to.be.true;
        expect(spyOnGetComponent.calledWith(ComponentUtil.getClassToken(PostProcessorClassA))).to.be.true;


        expect(componentClassA).to.be.instanceOf(ComponentClassA);
        expect(componentClassB).to.be.instanceOf(ComponentClassB);
        expect(controllerClassA).to.be.instanceOf(ControllerClassA);
        expect(definitionPostProcessorClassA).to.be.instanceOf(DefinitionPostProcessorClassA);
        expect(definitionPostProcessorClassB).to.be.instanceOf(DefinitionPostProcessorClassB);
        expect(postProcessorClassA).to.be.instanceOf(PostProcessorClassA);
    });

    it('should return Component with token', async function () {
        // given
        await appContext.start();
        let spyOnGetComponent = spy(localAppContext.injector, 'getComponent');

        // when
        let componentClassAToken = ComponentUtil.getClassToken(ComponentClassA);
        let componentClassA = appContext.getComponentWithToken(componentClassAToken);

        // then
        expect(spyOnGetComponent.calledWith(componentClassAToken)).to.be.true;
        expect(componentClassA).to.be.instanceOf(ComponentClassA);
    });

    it('should return Components with token', async function () {
        // given
        await appContext.start();
        let spyOnGetComponents = spy(localAppContext.injector, 'getComponents');

        // when
        let components = appContext.getComponentsWithToken(token);
        let componentClassA = appContext.getComponent(ComponentClassA);
        let componentClassB = appContext.getComponent(ComponentClassB);

        // then
        expect(spyOnGetComponents.calledWith(token)).to.be.true;
        expect(components.length).to.be.eq(2);
        expect(components).to.include.members([componentClassA, componentClassB]);
    });

    it('should return router', async function () {
        // given
        await appContext.start();

        // when
        let router = appContext.getRouter();

        // then
        expect(router).to.be.of.isPrototypeOf(Router);
        expect(router).to.be.equal(localAppContext.dispatcher.getRouter());
    });

    it('should start the app context', async function () {
        // given
        let initializeDefinitionPostProcessorsSpy = spy(appContext, 'initializeDefinitionPostProcessors');
        let initializePostProcessorsSpy = spy(appContext, 'initializePostProcessors');
        let postProcessDefinitionSpy = spy(appContext, 'postProcessDefinition');

        let initializeComponentsSpy = spy(appContext, 'initializeComponents');
        let wireComponentsSpy = spy(appContext, 'wireComponents');

        let postProcessBeforeInitSpy = spy(appContext, 'postProcessBeforeInit');
        let executePostConstructionSpy = spy(appContext, 'executePostConstruction');
        let postProcessAfterInitSpy = spy(appContext, 'postProcessAfterInit');

        // when
        await appContext.start();

        // then
        expect(initializeDefinitionPostProcessorsSpy.called).to.be.true;
        expect(initializePostProcessorsSpy.called).to.be.true;
        expect(postProcessDefinitionSpy.called).to.be.true;
        expect(initializeComponentsSpy.called).to.be.true;
        expect(wireComponentsSpy.called).to.be.true;
        expect(postProcessBeforeInitSpy.called).to.be.true;
        expect(executePostConstructionSpy.called).to.be.true;
        expect(postProcessAfterInitSpy.called).to.be.true;

        initializeDefinitionPostProcessorsSpy.restore();
        initializePostProcessorsSpy.restore();
        postProcessDefinitionSpy.restore();
        initializeComponentsSpy.restore();
        wireComponentsSpy.restore();
        postProcessBeforeInitSpy.restore();
        executePostConstructionSpy.restore();
        postProcessAfterInitSpy.restore();
    });

    it('should apply method implemented in the post processors', async function () {
        // given
        let spyOnDefinitionPostProcessorClassAPostProcessDefinition =
            spy(DefinitionPostProcessorClassA.prototype, 'postProcessDefinition');
        let spyOnDefinitionPostProcessorClassBPostProcessDefinition =
            spy(DefinitionPostProcessorClassB.prototype, 'postProcessDefinition');
        let spyOnPostProcessorClassAPostProcessBeforeInit = spy(PostProcessorClassA.prototype, 'postProcessBeforeInit');
        let spyOnPostProcessorClassAPostProcessAfterInit = spy(PostProcessorClassA.prototype, 'postProcessAfterInit');

        // when
        await appContext.start();
        let componentClassAInstance = appContext.getComponent(ComponentClassA);
        let componentClassBInstance = appContext.getComponent(ComponentClassB);
        let controllerClassAInstance = appContext.getComponent(ControllerClassA);

        // then
        expect(spyOnDefinitionPostProcessorClassAPostProcessDefinition.calledWith(ComponentClassA)).to.be.true;
        expect(spyOnDefinitionPostProcessorClassAPostProcessDefinition.calledWith(ComponentClassB)).to.be.true;
        expect(spyOnDefinitionPostProcessorClassAPostProcessDefinition.calledWith(ControllerClassA)).to.be.true;
        expect(spyOnDefinitionPostProcessorClassBPostProcessDefinition.calledWith(ComponentClassA)).to.be.true;
        expect(spyOnDefinitionPostProcessorClassBPostProcessDefinition.calledWith(ComponentClassB)).to.be.true;
        expect(spyOnDefinitionPostProcessorClassBPostProcessDefinition.calledWith(ControllerClassA)).to.be.true;
        expect(spyOnPostProcessorClassAPostProcessBeforeInit.calledWith(componentClassAInstance)).to.be.true;
        expect(spyOnPostProcessorClassAPostProcessBeforeInit.calledWith(componentClassBInstance)).to.be.true;
        expect(spyOnPostProcessorClassAPostProcessBeforeInit.calledWith(controllerClassAInstance)).to.be.true;
        expect(spyOnPostProcessorClassAPostProcessAfterInit.calledWith(componentClassAInstance)).to.be.true;
        expect(spyOnPostProcessorClassAPostProcessAfterInit.calledWith(componentClassBInstance)).to.be.true;
        expect(spyOnPostProcessorClassAPostProcessAfterInit.calledWith(controllerClassAInstance)).to.be.true;

        spyOnDefinitionPostProcessorClassAPostProcessDefinition.restore();
        spyOnDefinitionPostProcessorClassBPostProcessDefinition.restore();
        spyOnPostProcessorClassAPostProcessBeforeInit.restore();
        spyOnPostProcessorClassAPostProcessAfterInit.restore();
    });
});