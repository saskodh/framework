import { expect } from "chai";
import { ApplicationContext, ApplicationContextState } from "../../../src/lib/di/ApplicationContext";
import {
    Configuration, ConfigurationUtil,
    ConfigurationData
} from "../../../src/lib/decorators/ConfigurationDecorator";
import { Component, ComponentUtil } from "../../../src/lib/decorators/ComponentDecorator";
import { Controller } from "../../../src/lib/decorators/ControllerDecorator";
import { Qualifier } from "../../../src/lib/decorators/QualifierDecorator";
import { Router } from "express";
import { Injector } from "../../../src/lib/di/Injector";
import { Dispatcher } from "../../../src/lib/dispatcher/Dispatcher";
import { spy, stub, match } from "sinon";
import { ProcessHandler } from "../../../src/lib/helpers/ProcessHandler";
import { Profile } from "../../../src/lib/decorators/ProfileDecorators";

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

    @Configuration()
    class AppConfig {}

    ConfigurationUtil.getConfigurationData(AppConfig).componentFactory.components.push(ComponentClassA);
    ConfigurationUtil.getConfigurationData(AppConfig).componentFactory.components.push(ComponentClassB);
    ConfigurationUtil.getConfigurationData(AppConfig).componentFactory.components.push(ControllerClassA);
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

        // then
        expect(spyOnGetComponent.calledWith(ComponentUtil.getClassToken(ComponentClassA))).to.be.true;
        expect(spyOnGetComponent.calledWith(ComponentUtil.getClassToken(ComponentClassB))).to.be.true;
        expect(spyOnGetComponent.calledWith(ComponentUtil.getClassToken(ControllerClassA))).to.be.true;

        expect(componentClassA).to.be.instanceOf(ComponentClassA);
        expect(componentClassB).to.be.instanceOf(ComponentClassB);
        expect(controllerClassA).to.be.instanceOf(ControllerClassA);
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

    it('should get active components', async function () {
        // given
        let data1 = {
            profiles: ['dev']
        };
        let data2 = {
            profiles: ['other', '!dev']
        };
        let data3 = {
            profiles: []
        };
        let data4 = {
            profiles: ['other', '!mongo']
        };
        localAppContext.configurationData.componentFactory.components = ['comp1', 'comp2', 'comp3', 'comp4'];
        let stubOnGetActiveProfile = stub(appContext, 'getActiveProfiles').returns(['dev']);
        let stubOnGetComponentData = stub(ComponentUtil, 'getComponentData');
        stubOnGetComponentData.withArgs('comp1').returns(data1);
        stubOnGetComponentData.withArgs('comp2').returns(data2);
        stubOnGetComponentData.withArgs('comp3').returns(data3);
        stubOnGetComponentData.withArgs('comp4').returns(data4);

        // when
        let activeComponents = localAppContext.getActiveComponents();

        // then
        expect(activeComponents).to.be.eql(['comp1', 'comp3', 'comp4']);
        expect(stubOnGetComponentData.callCount).to.be.eq(4);
        expect(stubOnGetComponentData.calledWith('comp1')).to.be.true;
        expect(stubOnGetComponentData.calledWith('comp2')).to.be.true;
        expect(stubOnGetComponentData.calledWith('comp3')).to.be.true;
        expect(stubOnGetComponentData.calledWith('comp4')).to.be.true;

        // cleanup
        stubOnGetActiveProfile.restore();
        stubOnGetComponentData.restore();
    });

    it('should get active profile', async function () {
        // given
        let keyActive = (<any> ApplicationContext).ACTIVE_PROFILES_PROPERTY_KEY;
        let keyDefault = (<any> ApplicationContext).DEFAULT_PROFILES_PROPERTY_KEY;
        let stubOnGetConfigurationProperty = stub(appContext, 'getConfigurationProperty').returns('dev profile');
        stubOnGetConfigurationProperty.withArgs(keyActive).returns('someProfile,activeProfile');
        stubOnGetConfigurationProperty.withArgs(keyDefault).returns('defaultProfile');

        // when
        let profiles = localAppContext.getActiveProfiles();

        // then
        expect(stubOnGetConfigurationProperty.calledWith(keyActive)).to.be.true;
        expect(profiles.length).to.be.eq(2);
        expect(profiles).to.include.members(['activeProfile', 'someProfile']);

        // cleanup
        stubOnGetConfigurationProperty.restore();
    });

    it('should get default profile', async function () {
        // given
        let keyActive = (<any> ApplicationContext).ACTIVE_PROFILES_PROPERTY_KEY;
        let keyDefault = (<any> ApplicationContext).DEFAULT_PROFILES_PROPERTY_KEY;
        let stubOnGetConfigurationProperty = stub(appContext, 'getConfigurationProperty').returns('dev profile');
        stubOnGetConfigurationProperty.withArgs(keyActive).returns(undefined);
        stubOnGetConfigurationProperty.withArgs(keyDefault).returns('someProfile,defaultProfile');

        // when
        let profiles = localAppContext.getActiveProfiles();

        // then
        expect(stubOnGetConfigurationProperty.calledWith(keyActive)).to.be.true;
        expect(stubOnGetConfigurationProperty.calledWith(keyDefault)).to.be.true;
        expect(profiles.length).to.be.eq(2);
        expect(profiles).to.include.members(['defaultProfile', 'someProfile']);

        // cleanup
        stubOnGetConfigurationProperty.restore();
    });
});