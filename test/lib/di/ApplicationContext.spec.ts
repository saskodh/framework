import { expect } from "chai";
import { ApplicationContext, ApplicationContextState } from "../../../src/lib/di/ApplicationContext";
import {
    Configuration, ConfigurationUtil, ConfigurationData,
} from "../../../src/lib/decorators/ConfigurationDecorator";
import { ComponentUtil } from "../../../src/lib/decorators/ComponentDecorator";
import { Injector } from "../../../src/lib/di/Injector";
import { Dispatcher } from "../../../src/lib/web/Dispatcher";
import { spy, stub, match, assert } from "sinon";
import { ProcessHandler } from "../../../src/lib/helpers/ProcessHandler";
import {
    ComponentDefinitionPostProcessorUtil
} from "../../../src/lib/processors/ComponentDefinitionPostProcessor";
import {
    ComponentPostProcessorUtil
} from "../../../src/lib/processors/ComponentPostProcessor";
import { OrderUtil } from "../../../src/lib/decorators/OrderDecorator";
import { LifeCycleHooksUtil } from "../../../src/lib/decorators/LifeCycleHooksDecorators";
import { ActiveProfiles } from "../../../src/lib/decorators/ProfileDecorators";
import { Environment } from "../../../src/lib/di/Environment";

describe('ApplicationContext', function () {

    let appContext: ApplicationContext;
    let localAppContext;

    @ActiveProfiles('dev')
    @Configuration()
    class AppConfig {}

    beforeEach(() => {
        appContext = new ApplicationContext(AppConfig);
        localAppContext = <any> appContext;
    });

    it('should initialize properly', function () {
        // given
        let stubOnGetConfigurationData = stub(ConfigurationUtil, 'getConfigurationData')
            .returns(localAppContext.configurationData);
        let stubOnLoadAllComponents = stub(localAppContext.configurationData, 'loadAllComponents');
        let stubOnSetActiveProfiles = stub(Environment.prototype, 'setActiveProfiles');
        let stubOnSetApplicationProperties = stub(Environment.prototype, 'setApplicationProperties');
        let stubOnRegister = stub(Injector.prototype, 'register');

        // when
        localAppContext = <any> new ApplicationContext(AppConfig);

        // then
        expect(localAppContext.state).to.be.eq(ApplicationContextState.NOT_INITIALIZED);
        expect(localAppContext.injector).to.be.instanceOf(Injector);
        expect(localAppContext.dispatcher).to.be.instanceOf(Dispatcher);
        expect(stubOnGetConfigurationData.calledWith(AppConfig)).to.be.true;
        expect(stubOnLoadAllComponents.called).to.be.true;
        expect(localAppContext.configurationData).to.be.instanceOf(ConfigurationData);
        expect(localAppContext.environment).to.be.instanceOf(Environment);

        expect(stubOnSetActiveProfiles.calledOnce).to.be.true;
        expect(stubOnSetActiveProfiles.calledWith(...localAppContext.configurationData.activeProfiles)).to.be.true;
        expect(stubOnSetApplicationProperties.calledOnce).to.be.true;
        expect(stubOnSetApplicationProperties
            .calledWith(localAppContext.configurationData.propertySourcePaths)).to.be.true;
        expect(stubOnRegister.calledOnce).to.be.true;
        expect(stubOnRegister.args)
            .to.eql([[ComponentUtil.getComponentData(Environment).classToken, localAppContext.environment]]);
        expect(stubOnLoadAllComponents.calledOnce).to.be.true;

        assert.callOrder(stubOnSetActiveProfiles, stubOnSetApplicationProperties, stubOnRegister,
            stubOnLoadAllComponents);

        // cleanup
        stubOnGetConfigurationData.restore();
        stubOnLoadAllComponents.restore();
        stubOnSetActiveProfiles.restore();
        stubOnSetApplicationProperties.restore();
        stubOnRegister.restore();
    });

    it('should return Component with class token', async function () {
        // given
        await appContext.start();
        let stubOnVerifyContextReady = stub(localAppContext, 'verifyContextReady');
        let stubOnGetComponent = stub(localAppContext.injector, 'getComponent').returns('component');
        let stubOnGetClassToken = stub(ComponentUtil, 'getClassToken').returns('class token');

        // when
        let component = appContext.getComponent('class');

        // then
        expect(stubOnVerifyContextReady.calledOnce).to.be.true;
        expect(stubOnGetClassToken.calledWith('class')).to.be.true;
        expect(stubOnGetComponent.calledWith('class token')).to.be.true;
        expect(component).to.be.eq('component');
        // cleanup
        stubOnVerifyContextReady.restore();
        stubOnGetComponent.restore();
        stubOnGetClassToken.restore();
    });

    it('should return Component with token', async function () {
        // given
        await appContext.start();
        let stubOnVerifyContextReady = stub(localAppContext, 'verifyContextReady');
        let stubOnGetComponent = stub(localAppContext.injector, 'getComponent').returns('component');
        let token = Symbol('token');

        // when
        let component = appContext.getComponentWithToken(token);

        // then
        expect(stubOnVerifyContextReady.calledOnce).to.be.true;
        expect(stubOnGetComponent.calledWith(token)).to.be.true;
        expect(component).to.be.eq('component');
        // cleanup
        stubOnVerifyContextReady.restore();
        stubOnGetComponent.restore();
    });

    it('should return Components with token', async function () {
        // given
        await appContext.start();
        let stubOnVerifyContextReady = stub(localAppContext, 'verifyContextReady');
        let stubOnGetComponents = stub(localAppContext.injector, 'getComponents').returns(['component1', 'component2']);
        let token = Symbol('token');

        // when
        let components = appContext.getComponentsWithToken(token);

        // then
        expect(stubOnVerifyContextReady.calledOnce).to.be.true;
        expect(stubOnGetComponents.calledWith(token)).to.be.true;
        expect(components).to.be.eql(['component1', 'component2']);
        // cleanup
        stubOnVerifyContextReady.restore();
        stubOnGetComponents.restore();
    });

    it('should return router', async function () {
        // given
        await appContext.start();
        let stubOnVerifyContextReady = stub(localAppContext, 'verifyContextReady');
        let stubOnGetRouter = stub(localAppContext.dispatcher, 'getRouter').returns('router');

        // when
        let router = appContext.getRouter();

        // then
        expect(stubOnVerifyContextReady.calledOnce).to.be.true;
        expect(stubOnGetRouter.calledOnce).to.be.true;
        expect(router).to.be.eql('router');
        // cleanup
        stubOnVerifyContextReady.restore();
        stubOnGetRouter.restore();
    });

    it('should throw context already initialized error if start is called more than once', async function () {
        // given
        await appContext.start();

        // when / then
        expect(appContext.start.bind).to.throw(Error);
    });

    it('should start the app context', async function () {
        // given
        let stubOnInitializeDefinitionPostProcessors = stub(appContext, 'initializeDefinitionPostProcessors');
        let stubOnInitializePostProcessors = stub(appContext, 'initializePostProcessors');
        let stubOnPostProcessDefinition = stub(appContext, 'postProcessDefinition');

        let stubOnInitializeComponents = stub(appContext, 'initializeComponents');
        let stubOnWireComponents = stub(appContext, 'wireComponents');

        let stubOnPostProcessBeforeInit = stub(appContext, 'postProcessBeforeInit');
        let stubOnExecutePostConstruction = stub(appContext, 'executePostConstruction');
        let stubOnPostProcessAfterInit = stub(appContext, 'postProcessAfterInit');

        let stubOnDispatcherPostConstruct = stub((<any> appContext).dispatcher, 'postConstruct');

        // when
        await appContext.start();

        // then
        expect(stubOnInitializeDefinitionPostProcessors.calledOnce).to.be.true;
        expect(stubOnInitializePostProcessors.calledOnce).to.be.true;
        expect(stubOnPostProcessDefinition.calledOnce).to.be.true;
        expect(stubOnInitializeComponents.calledOnce).to.be.true;
        expect(stubOnWireComponents.calledOnce).to.be.true;
        expect(stubOnPostProcessBeforeInit.calledOnce).to.be.true;
        expect(stubOnExecutePostConstruction.calledOnce).to.be.true;
        expect(stubOnPostProcessAfterInit.calledOnce).to.be.true;
        expect(localAppContext.state).to.be.eq(ApplicationContextState.READY);
        expect(stubOnDispatcherPostConstruct.called).to.be.true;

        stubOnInitializeDefinitionPostProcessors.restore();
        stubOnInitializePostProcessors.restore();
        stubOnPostProcessDefinition.restore();
        stubOnInitializeComponents.restore();
        stubOnWireComponents.restore();
        stubOnPostProcessBeforeInit.restore();
        stubOnExecutePostConstruction.restore();
        stubOnPostProcessAfterInit.restore();
        stubOnDispatcherPostConstruct.restore();
    });

    it('should return environment', async function () {
        // given
        await appContext.start();

        // when
        let environment = appContext.getEnvironment();

        // then
        expect(environment).to.be.of.isPrototypeOf(Environment);
        expect(environment).to.be.equal(localAppContext.environment);
    });

    it('should destroy appContext when context state is READY', async function () {
        // given
        await appContext.start();
        let stubOnExecutePreDestruction = stub(appContext, 'executePreDestruction');

        // when
        await appContext.destroy();

        // / then
        expect(localAppContext.state).to.be.eq(ApplicationContextState.NOT_INITIALIZED);
        expect(localAppContext.injector).to.be.null;
        expect(localAppContext.dispatcher).to.be.null;
        expect(localAppContext.state).to.be.eq(ApplicationContextState.NOT_INITIALIZED);
        expect(stubOnExecutePreDestruction.calledOnce).to.be.true;
        // cleanup
        stubOnExecutePreDestruction.restore();
    });

    it('should destroy appContext when context state is not READY', async function () {
        // given
        let stubOnExecutePreDestruction = stub(appContext, 'executePreDestruction');

        // when
        await appContext.destroy();

        // / then
        expect(localAppContext.state).to.be.eq(ApplicationContextState.NOT_INITIALIZED);
        expect(localAppContext.injector).to.be.null;
        expect(localAppContext.dispatcher).to.be.null;
        expect(localAppContext.state).to.be.eq(ApplicationContextState.NOT_INITIALIZED);
        expect(stubOnExecutePreDestruction.called).to.be.false;
        // cleanup
        stubOnExecutePreDestruction.restore();
    });

    it('should destroy appContext when context state is READY-1', async function () {
        // given
        await appContext.start();
        let stubOnExecutePreDestruction = stub(appContext, 'executePreDestruction');
        let testSpy = spy();
        localAppContext.unRegisterExitListenerCallback = () => { testSpy(); };

        // when
        await appContext.destroy();

        // / then
        expect(localAppContext.state).to.be.eq(ApplicationContextState.NOT_INITIALIZED);
        expect(localAppContext.injector).to.be.null;
        expect(localAppContext.dispatcher).to.be.null;
        expect(stubOnExecutePreDestruction.calledOnce).to.be.true;
        expect(testSpy.called).to.be.true;
        // cleanup
        stubOnExecutePreDestruction.restore();
    });

    it('should register exit hook', async function () {
        // given
        let stubOnDestroy = stub(appContext, 'destroy');
        let processHandler = ProcessHandler.getInstance();
        let stubOnRegisterOnExitListener = stub(processHandler, 'registerOnExitListener').returns('unRegisterCallback');

        // when
        appContext.registerExitHook();
        let exitListener = stubOnRegisterOnExitListener.args[0][0];
        exitListener();

        // / then
        expect(stubOnDestroy.calledOnce).to.be.true;
        expect(stubOnRegisterOnExitListener.calledWith(match.func)).to.be.true;
        expect(localAppContext.unRegisterExitListenerCallback).to.be.eq('unRegisterCallback');

        // cleanup
        stubOnDestroy.restore();
        stubOnRegisterOnExitListener.restore();
    });

    it('should initialize components', async function () {
        // given
        class Comp1 {}
        class Comp2 {}
        let data1 = {
            aliasTokens: ['alias1'],
            classToken: 'class token 1'
        };
        let data2 = {
            aliasTokens: ['alias2'],
            classToken: 'class token 2'
        };
        let stubOnGetActiveComponents = stub(appContext, 'getActiveComponents').returns([Comp1, Comp2]);
        let stubOnGetComponentData = stub(ComponentUtil, 'getComponentData');
        stubOnGetComponentData.withArgs(Comp1).returns(data1);
        stubOnGetComponentData.withArgs(Comp2).returns(data2);
        let stubOnNewComponent1 = stub(Comp1.prototype, 'constructor');
        let stubOnNewComponent2 = stub(Comp2.prototype, 'constructor');
        let stubOnInjectorRegister = stub(localAppContext.injector, 'register');
        let instance1 = new Comp1();
        let instance2 = new Comp2();

        // when
        localAppContext.initializeComponents();

        // then
        expect(stubOnGetActiveComponents.calledOnce).to.be.true;
        expect(stubOnGetComponentData.calledWith(Comp1)).to.be.true;
        expect(stubOnGetComponentData.calledWith(Comp2)).to.be.true;
        expect(stubOnInjectorRegister.calledWith('class token 1', instance1)).to.be.true;
        expect(stubOnInjectorRegister.calledWith('class token 2', instance2)).to.be.true;
        expect(stubOnInjectorRegister.calledWith('alias1', instance2)).to.be.true;
        expect(stubOnInjectorRegister.calledWith('alias2', instance2)).to.be.true;
        // cleanup
        stubOnGetActiveComponents.restore();
        stubOnGetComponentData.restore();
        stubOnNewComponent1.restore();
        stubOnNewComponent2.restore();
        stubOnInjectorRegister.restore();
    });

    it('should wire components', async function () {
        // given
        let componentData = {
            classToken : 'class token'
        };
        let dependencyData1 = {
            token: 'token 1',
            isArray: false
        };
        let dependencyData2 = {
            token: 'token 2',
            isArray: true
        };
        let dependencies = new Map();
        dependencies.set('dependency data 1', dependencyData1);
        dependencies.set('dependency data 2', dependencyData2);
        let properties = new Map();
        properties.set('prop 1', 'value 1');
        let injectionData = {
            dependencies: dependencies,
            dynamicDependencies: [],
            properties: properties
        };
        let stubOnGetActiveComponents = stub(appContext, 'getActiveComponents').returns(['comp1']);
        let stubOnGetComponentData = stub(ComponentUtil, 'getComponentData').returns(componentData);
        let stubOnGetInjectionData = stub(ComponentUtil, 'getInjectionData').returns(injectionData);
        let stubOnGetComponent = stub(localAppContext.injector, 'getComponent').returns('instance 1');
        stubOnGetComponent.withArgs('class token').returns('instance 1');
        stubOnGetComponent.withArgs('token 1').returns('injected instance 1');
        let stubOnGetComponents = stub(localAppContext.injector, 'getComponents');
        stubOnGetComponents.withArgs('token 2').returns(['injected instance 2', 'injected instance 3']);
        let stubOnReflectSet = stub(Reflect, 'set');
        let stubOnEnvironmentGetProperty = stub(Environment.prototype, 'getProperty').returns('value 1');
        let stubOnProcessAfterInit = stub(Dispatcher.prototype, 'processAfterInit');

        // when
        await localAppContext.wireComponents();

        // then
        expect(stubOnGetActiveComponents.calledOnce).to.be.true;
        expect(stubOnGetComponentData.calledWith('comp1')).to.be.true;
        expect(stubOnGetInjectionData.calledWith('comp1')).to.be.true;
        expect(stubOnGetComponent.calledWith('class token')).to.be.true;
        expect(stubOnGetComponent.calledWith('token 1')).to.be.true;
        expect(stubOnReflectSet.calledWith('instance 1', 'dependency data 1', 'injected instance 1')).to.be.true;
        expect(stubOnReflectSet
            .calledWith('instance 1', 'dependency data 2', ['injected instance 2', 'injected instance 3'])).to.be.true;
        expect(stubOnReflectSet.calledWith('instance 1', 'prop 1', 'value 1')).to.be.true;
        expect(stubOnProcessAfterInit.calledWith('comp1', 'instance 1')).to.be.true;
        expect(stubOnEnvironmentGetProperty.calledWith('value 1')).to.be.true;
        // cleanup
        stubOnGetActiveComponents.restore();
        stubOnGetComponentData.restore();
        stubOnGetInjectionData.restore();
        stubOnGetComponent.restore();
        stubOnReflectSet.restore();
        stubOnEnvironmentGetProperty.restore();
        stubOnProcessAfterInit.restore();
    });

    it('should execute post construction', async function () {
        // given
        let testSpy = spy();
        let stubOnGetActiveComponents = stub (appContext, 'getActiveComponents')
            .returns(['componentOne', 'componentTwo']);
        let stubOnGetComponentData = stub(ComponentUtil, 'getComponentData');
        stubOnGetComponentData.withArgs('componentOne').returns({classToken: 'firstToken'});
        stubOnGetComponentData.withArgs('componentTwo').returns({classToken: 'secondToken'});
        let stubOnGetConfig = stub(LifeCycleHooksUtil, 'getConfig');
        stubOnGetConfig.withArgs('componentOne').returns({});
        stubOnGetConfig.withArgs('componentTwo').returns({postConstructMethod: 'testSpy'});
        let stubOnGetComponent = stub(Injector.prototype, 'getComponent');
        stubOnGetComponent.withArgs('firstToken').returns({testSpy});
        stubOnGetComponent.withArgs('secondToken').returns({testSpy});


        // when
        await localAppContext.executePostConstruction();

        // then
        expect(testSpy.calledOnce).to.be.true;
        expect(stubOnGetConfig.calledTwice).to.be.true;
        expect(stubOnGetConfig.args).to.be.eql([['componentOne'], ['componentTwo']]);

        // cleanup
        stubOnGetActiveComponents.restore();
        stubOnGetComponentData.restore();
        stubOnGetConfig.restore();
        stubOnGetComponent.restore();
    });

    it('should throw on execute post construction when postConstructMethod is not a method', async function () {
        // given
        let stubOnGetActiveComponents = stub (appContext, 'getActiveComponents')
            .returns(['component']);
        let stubOnGetComponentData = stub(ComponentUtil, 'getComponentData');
        stubOnGetComponentData.withArgs('component').returns({classToken: 'token'});
        let stubOnGetConfig = stub(LifeCycleHooksUtil, 'getConfig');
        stubOnGetConfig.withArgs('component').returns({postConstructMethod: 'someObject'});
        let stubOnGetComponent = stub(Injector.prototype, 'getComponent');
        stubOnGetComponent.withArgs('token').returns({someObject: 'value'});
        let hasThrown = false;


        // when / then
        try {
            await localAppContext.executePostConstruction();
        } catch (error) {
            hasThrown = true;
        }
        expect(hasThrown).to.be.true;

        // cleanup
        stubOnGetActiveComponents.restore();
        stubOnGetComponentData.restore();
        stubOnGetConfig.restore();
        stubOnGetComponent.restore();
    });

    it('should execute pre destruction', async function () {
        // given
        let testSpy = spy();
        let stubOnGetActiveComponents = stub (appContext, 'getActiveComponents')
            .returns(['componentOne', 'componentTwo']);
        let stubOnGetComponentData = stub(ComponentUtil, 'getComponentData');
        stubOnGetComponentData.withArgs('componentOne').returns({classToken: 'firstToken'});
        stubOnGetComponentData.withArgs('componentTwo').returns({classToken: 'secondToken'});
        let stubOnGetConfig = stub(LifeCycleHooksUtil, 'getConfig');
        stubOnGetConfig.withArgs('componentOne').returns({});
        stubOnGetConfig.withArgs('componentTwo').returns({preDestroyMethod: 'testSpy'});
        let stubOnGetComponent = stub(Injector.prototype, 'getComponent');
        stubOnGetComponent.withArgs('firstToken').returns({testSpy});
        stubOnGetComponent.withArgs('secondToken').returns({testSpy});


        // when
        await localAppContext.executePreDestruction();

        // then
        expect(testSpy.calledOnce).to.be.true;
        expect(stubOnGetConfig.calledTwice).to.be.true;
        expect(stubOnGetConfig.args).to.be.eql([['componentOne'], ['componentTwo']]);

        // cleanup
        stubOnGetActiveComponents.restore();
        stubOnGetComponentData.restore();
        stubOnGetConfig.restore();
        stubOnGetComponent.restore();
    });

    it('should throw on execute post construction when postConstructMethod is not a method', async function () {
        // given
        let stubOnGetActiveComponents = stub (appContext, 'getActiveComponents')
            .returns(['component']);
        let stubOnGetComponentData = stub(ComponentUtil, 'getComponentData');
        stubOnGetComponentData.withArgs('component').returns({classToken: 'token'});
        let stubOnGetConfig = stub(LifeCycleHooksUtil, 'getConfig');
        stubOnGetConfig.withArgs('component').returns({preDestroyMethod: 'someObject'});
        let stubOnGetComponent = stub(Injector.prototype, 'getComponent');
        stubOnGetComponent.withArgs('token').returns({someObject: 'value'});
        let hasThrown = false;


        // when / then
        try {
            await localAppContext.executePreDestruction();
        } catch (error) {
            hasThrown = true;
        }
        expect(hasThrown).to.be.true;

        // cleanup
        stubOnGetActiveComponents.restore();
        stubOnGetComponentData.restore();
        stubOnGetConfig.restore();
        stubOnGetComponent.restore();
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
        let stubOnAcceptsProfiles =
            stub(localAppContext.environment, 'acceptsProfiles', (profile) => profile === 'dev');
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
        stubOnAcceptsProfiles.restore();
        stubOnGetComponentData.restore();
    });

    it('should verify if context is ready', async function () {
        // given
        localAppContext.state = ApplicationContextState.READY;

        // when
        let isContextReady = localAppContext.verifyContextReady();

        // then
        expect(isContextReady).to.be.undefined;
    });

    it('should throw error if context state is not ready', async function () {
        // given
        localAppContext.state = ApplicationContextState.NOT_INITIALIZED;

        // when / then
        expect(localAppContext.verifyContextReady.bind(localAppContext)).to.throw(Error);
    });
});

describe('DefinitionPostProcessors', function() {

    let appContext: ApplicationContext;
    let localAppContext;

    @Configuration()
    class AppConfig {}

    beforeEach(() => {
        appContext = new ApplicationContext(AppConfig);
        localAppContext = <any> appContext;
    });

    it('should initialize definition post processors', async function () {
        // given
        class DefinitionPostProcessor1 {}
        class DefinitionPostProcessor2 {}
        let data1 = {
            aliasTokens: ['alias1'],
            classToken: 'class token 1'
        };
        let data2 = {
            aliasTokens: ['alias2'],
            classToken: 'class token 2'
        };
        let stubOnGetActiveDefinitionPostProcessors = stub(appContext, 'getActiveDefinitionPostProcessors')
            .returns([DefinitionPostProcessor1, DefinitionPostProcessor2]);
        let stubOnGetComponentData = stub(ComponentUtil, 'getComponentData');
        stubOnGetComponentData.withArgs(DefinitionPostProcessor1).returns(data1);
        stubOnGetComponentData.withArgs(DefinitionPostProcessor2).returns(data2);
        let stubOnNewComponent1 = stub(DefinitionPostProcessor1.prototype, 'constructor');
        let stubOnNewComponent2 = stub(DefinitionPostProcessor2.prototype, 'constructor');
        let stubOnInjectorRegister = stub(localAppContext.injector, 'register');
        let stubOnIsComponentDefinitionPostProcessor =
            stub(ComponentDefinitionPostProcessorUtil, 'isIComponentDefinitionPostProcessor').returns(true);
        let instance1 = new DefinitionPostProcessor1();
        let instance2 = new DefinitionPostProcessor2();

        // when
        localAppContext.initializeDefinitionPostProcessors();

        // then
        expect(stubOnGetActiveDefinitionPostProcessors.calledOnce).to.be.true;
        expect(stubOnGetComponentData.calledWith(DefinitionPostProcessor1)).to.be.true;
        expect(stubOnGetComponentData.calledWith(DefinitionPostProcessor2)).to.be.true;
        expect(stubOnInjectorRegister.calledWith('class token 1', instance1)).to.be.true;
        expect(stubOnInjectorRegister.calledWith('class token 2', instance2)).to.be.true;
        expect(stubOnInjectorRegister.calledWith('alias1', instance1)).to.be.true;
        expect(stubOnInjectorRegister.calledWith('alias2', instance2)).to.be.true;
        expect(stubOnIsComponentDefinitionPostProcessor.calledTwice).to.be.true;
        // cleanup
        stubOnGetActiveDefinitionPostProcessors.restore();
        stubOnGetComponentData.restore();
        stubOnNewComponent1.restore();
        stubOnNewComponent2.restore();
        stubOnInjectorRegister.restore();
        stubOnIsComponentDefinitionPostProcessor.restore();
    });

    it('should apply the postProcess definition method from all the definition post processors', async function () {
        // given
        let stub1 = stub();
        let stub2 = stub().returns(() => {}); // tslint:disable-line
        let stub3 = stub().returns(() => {}); // tslint:disable-line
        let definitionPostProcessor1 = {
            postProcessDefinition : stub1
        };
        let definitionPostProcessor2 = {
            postProcessDefinition : stub2
        };
        let definitionPostProcessor3 = {
            postProcessDefinition : stub3
        };
        localAppContext.configurationData.componentFactory.components = ['comp1', 'comp2'];
        let stubOnGetOrderedDefinitionPostProcessors = stub(appContext, 'getOrderedDefinitionPostProcessors')
            .returns([definitionPostProcessor1, definitionPostProcessor2, definitionPostProcessor3]);


        // when
        await localAppContext.postProcessDefinition();

        // then
        expect(stubOnGetOrderedDefinitionPostProcessors.calledTwice).to.be.true;
        expect(stub1.calledTwice).to.be.true;
        expect(stub2.calledTwice).to.be.true;
        expect(stub3.calledTwice).to.be.true;
        expect(stub1.calledWith('comp1')).to.be.true;
        expect(stub1.calledWith('comp2')).to.be.true;
        expect(stub2.calledWith('comp1')).to.be.true;
        expect(stub2.calledWith('comp2')).to.be.true;
        expect(stub3.calledWith(match.func)).to.be.true;
        expect(stub3.calledWith(match.func)).to.be.true;
        expect(localAppContext.configurationData.componentFactory.components[0]).to.be.instanceOf(Function);
        expect(localAppContext.configurationData.componentFactory.components[1]).to.be.instanceOf(Function);
        // cleanup
        stubOnGetOrderedDefinitionPostProcessors.restore();
    });

    it('should throw error if definition post processor return something other than function', async function () {
        // given
        let stub1 = stub().returns(1);
        let definitionPostProcessor1 = {
            postProcessDefinition : stub1
        };
        localAppContext.configurationData.componentFactory.components = ['comp1'];
        let stubOnGetOrderedDefinitionPostProcessors = stub(appContext, 'getOrderedDefinitionPostProcessors')
            .returns([definitionPostProcessor1]);


        // when
        let hasThrown = false;
        try {
            await localAppContext.postProcessDefinition();
        } catch (err) {
            hasThrown = true;
        }

        // then
        expect(hasThrown).to.be.true;
        expect(stubOnGetOrderedDefinitionPostProcessors.calledOnce).to.be.true;
        expect(stub1.calledOnce).to.be.true;
        expect(stub1.calledWith('comp1')).to.be.true;
        // cleanup
        stubOnGetOrderedDefinitionPostProcessors.restore();
    });

    it('should throw error if target does not implement the IComponentDefinitionPostProcessor', async function () {
        // given
        class DefinitionPostProcessor1 {}
        let data1 = {
            aliasTokens: ['alias1'],
            classToken: 'class token 1'
        };
        let stubOnGetActiveDefinitionPostProcessors = stub(appContext, 'getActiveDefinitionPostProcessors')
            .returns([DefinitionPostProcessor1]);
        let stubOnGetComponentData = stub(ComponentUtil, 'getComponentData');
        stubOnGetComponentData.withArgs(DefinitionPostProcessor1).returns(data1);
        let stubOnNewComponent1 = stub(DefinitionPostProcessor1.prototype, 'constructor');
        let stubOnInjectorRegister = stub(localAppContext.injector, 'register');
        let stubOnIsComponentDefinitionPostProcessor =
            stub(ComponentDefinitionPostProcessorUtil, 'isIComponentDefinitionPostProcessor').returns(false);
        let instance1 = new DefinitionPostProcessor1();

        // when
        let hasThrown = false;
        try {
            localAppContext.initializeDefinitionPostProcessors();
        } catch (err) {
            hasThrown = true;
        }

        // then
        expect(hasThrown).to.be.true;
        expect(stubOnGetActiveDefinitionPostProcessors.calledOnce).to.be.true;
        expect(stubOnGetComponentData.calledWith(DefinitionPostProcessor1)).to.be.true;
        expect(stubOnIsComponentDefinitionPostProcessor.calledWith(instance1)).to.be.true;
        expect(stubOnIsComponentDefinitionPostProcessor.calledOnce).to.be.true;
        // cleanup
        stubOnGetActiveDefinitionPostProcessors.restore();
        stubOnGetComponentData.restore();
        stubOnNewComponent1.restore();
        stubOnInjectorRegister.restore();
        stubOnIsComponentDefinitionPostProcessor.restore();
    });

    it('should get active definition post processors', async function () {
        // given
        let data1 = {
            profiles: ['dev']
        };
        let data2 = {
            profiles: ['other']
        };

        let data3 = {
            profiles: []
        };
        localAppContext.configurationData.componentDefinitionPostProcessorFactory
            .components = ['comp1', 'comp2', 'comp3'];
        let stubOnGetActiveProfile = stub(localAppContext.environment, 'getActiveProfiles').returns(['dev']);
        let stubOnGetComponentData = stub(ComponentUtil, 'getComponentData');
        stubOnGetComponentData.withArgs('comp1').returns(data1);
        stubOnGetComponentData.withArgs('comp2').returns(data2);
        stubOnGetComponentData.withArgs('comp3').returns(data3);
        let stubOnOrderList = stub(OrderUtil, 'orderList').returns(['comp1', 'comp3']);

        // when
        let activeDefinitionPostProcessors = localAppContext.getActiveDefinitionPostProcessors();

        // then
        expect(activeDefinitionPostProcessors).to.be.eql(['comp1', 'comp3']);
        expect(stubOnOrderList.calledWith(['comp1', 'comp3'])).to.be.true;
        expect(stubOnGetComponentData.callCount).to.be.eq(3);
        expect(stubOnGetComponentData.calledWith('comp1')).to.be.true;
        expect(stubOnGetComponentData.calledWith('comp2')).to.be.true;
        expect(stubOnGetComponentData.calledWith('comp3')).to.be.true;
        // cleanup
        stubOnGetActiveProfile.restore();
        stubOnGetComponentData.restore();
        stubOnOrderList.restore();
    });

    it('should get ordered definition post processors', async function () {
        // given
        let data1 = {
            classToken: 'class token 1'
        };
        let data2 = {
            classToken: 'class token 2'
        };
        let stubOnGetActiveDefinitionPostProcessors = stub(appContext, 'getActiveDefinitionPostProcessors')
            .returns(['comp1', 'comp2']);
        let stubOnGetComponentData = stub(ComponentUtil, 'getComponentData');
        stubOnGetComponentData.withArgs('comp1').returns(data1);
        stubOnGetComponentData.withArgs('comp2').returns(data2);
        let stubOnInjectorGetComponent = stub(localAppContext.injector, 'getComponent');
        stubOnInjectorGetComponent.withArgs('class token 1').returns('definition post processor 1');
        stubOnInjectorGetComponent.withArgs('class token 2').returns('definition post processor 2');

        // when
        let definitionPostProcessors = localAppContext.getOrderedDefinitionPostProcessors();

        // then
        expect(stubOnGetActiveDefinitionPostProcessors.calledOnce).to.be.true;
        expect(stubOnGetComponentData.calledTwice).to.be.true;
        expect(stubOnGetComponentData.calledWith('comp1')).to.be.true;
        expect(stubOnGetComponentData.calledWith('comp2')).to.be.true;
        expect(stubOnInjectorGetComponent.calledTwice).to.be.true;
        expect(stubOnInjectorGetComponent.calledWith('class token 1')).to.be.true;
        expect(stubOnInjectorGetComponent.calledWith('class token 2')).to.be.true;
        expect(definitionPostProcessors).to.be.eql(['definition post processor 1', 'definition post processor 2']);
        // cleanup
        stubOnGetActiveDefinitionPostProcessors.restore();
        stubOnGetComponentData.restore();
        stubOnInjectorGetComponent.restore();
    });
});

describe('PostProcessors', function() {

    let appContext: ApplicationContext;
    let localAppContext;

    @Configuration()
    class AppConfig {}

    beforeEach(() => {
        appContext = new ApplicationContext(AppConfig);
        localAppContext = <any> appContext;
    });

    it('should initialize post processors', async function () {
        // given
        class PostProcessor1 {}
        class PostProcessor2 {}
        let data1 = {
            aliasTokens: ['alias1'],
            classToken: 'class token 1'
        };
        let data2 = {
            aliasTokens: ['alias2'],
            classToken: 'class token 2'
        };
        let stubOnGetActivePostProcessors = stub(appContext, 'getActivePostProcessors')
            .returns([PostProcessor1, PostProcessor2]);
        let stubOnGetComponentData = stub(ComponentUtil, 'getComponentData');
        stubOnGetComponentData.withArgs(PostProcessor1).returns(data1);
        stubOnGetComponentData.withArgs(PostProcessor2).returns(data2);
        let stubOnNewComponent1 = stub(PostProcessor1.prototype, 'constructor');
        let stubOnNewComponent2 = stub(PostProcessor2.prototype, 'constructor');
        let stubOnInjectorRegister = stub(localAppContext.injector, 'register');
        let stubOnIsComponentPostProcessor =
            stub(ComponentPostProcessorUtil, 'isIComponentPostProcessor').returns(true);
        let instance1 = new PostProcessor1();
        let instance2 = new PostProcessor2();

        // when
        localAppContext.initializePostProcessors();

        // then
        expect(stubOnGetActivePostProcessors.calledOnce).to.be.true;
        expect(stubOnGetComponentData.calledWith(PostProcessor1)).to.be.true;
        expect(stubOnGetComponentData.calledWith(PostProcessor2)).to.be.true;
        expect(stubOnInjectorRegister.calledWith('class token 1', instance1)).to.be.true;
        expect(stubOnInjectorRegister.calledWith('class token 2', instance2)).to.be.true;
        expect(stubOnInjectorRegister.calledWith('alias1', instance1)).to.be.true;
        expect(stubOnInjectorRegister.calledWith('alias2', instance2)).to.be.true;
        expect(stubOnIsComponentPostProcessor.calledTwice).to.be.true;
        // cleanup
        stubOnGetActivePostProcessors.restore();
        stubOnGetComponentData.restore();
        stubOnNewComponent1.restore();
        stubOnNewComponent2.restore();
        stubOnInjectorRegister.restore();
        stubOnIsComponentPostProcessor.restore();
    });

    it('should throw error if target does not implement the IComponentDefinitionPostProcessor', async function () {
        // given
        class PostProcessor1 {}
        let data1 = {
            aliasTokens: ['alias1'],
            classToken: 'class token 1'
        };
        let stubOnGetActivePostProcessors = stub(appContext, 'getActivePostProcessors')
            .returns([PostProcessor1]);
        let stubOnGetComponentData = stub(ComponentUtil, 'getComponentData');
        stubOnGetComponentData.withArgs(PostProcessor1).returns(data1);
        let stubOnNewComponent1 = stub(PostProcessor1.prototype, 'constructor');
        let stubOnInjectorRegister = stub(localAppContext.injector, 'register');
        let stubOnIsComponentPostProcessor =
            stub(ComponentPostProcessorUtil, 'isIComponentPostProcessor').returns(false);
        let instance1 = new PostProcessor1();

        // when
        let hasThrown = false;
        try {
            localAppContext.initializePostProcessors();
        } catch (err) {
            hasThrown = true;
        }

        // then
        expect(hasThrown).to.be.true;
        expect(stubOnGetActivePostProcessors.calledOnce).to.be.true;
        expect(stubOnGetComponentData.calledWith(PostProcessor1)).to.be.true;
        expect(stubOnIsComponentPostProcessor.calledWith(instance1)).to.be.true;
        expect(stubOnIsComponentPostProcessor.calledOnce).to.be.true;
        // cleanup
        stubOnGetActivePostProcessors.restore();
        stubOnGetComponentData.restore();
        stubOnNewComponent1.restore();
        stubOnInjectorRegister.restore();
        stubOnIsComponentPostProcessor.restore();
    });

    it('should post process before init', async function () {
        // given
        let spy1 = spy();
        let spy2 = spy();
        let postProcessor1 = {
            postProcessBeforeInit: spy1
        };
        let postProcessor2 = {
            postProcessBeforeInit: spy2
        };
        let data1 = {
            classToken: 'class token 1'
        };
        let data2 = {
            classToken: 'class token 2'
        };
        let stubOnGetOrderedPostProcessors = stub(appContext, 'getOrderedPostProcessors')
            .returns([postProcessor1, postProcessor2]);
        let stubOnGetActiveComponents = stub(appContext, 'getActiveComponents').returns(['comp1', 'comp2']);
        let stubOnGetComponentData = stub(ComponentUtil, 'getComponentData');
        stubOnGetComponentData.withArgs('comp1').returns(data1);
        stubOnGetComponentData.withArgs('comp2').returns(data2);
        let stubOnInjectorGetComponent = stub(localAppContext.injector, 'getComponent');
        stubOnInjectorGetComponent.withArgs('class token 1').returns('instance1');
        stubOnInjectorGetComponent.withArgs('class token 2').returns('instance2');


        // when
        localAppContext.postProcessBeforeInit();

        // then
        expect(stubOnGetOrderedPostProcessors.calledOnce).to.be.true;
        expect(stubOnGetActiveComponents.calledTwice).to.be.true;
        expect(stubOnGetComponentData.callCount).to.be.eq(4);
        expect(stubOnGetComponentData.calledWith('comp1')).to.be.true;
        expect(stubOnGetComponentData.calledWith('comp2')).to.be.true;
        expect(stubOnInjectorGetComponent.callCount).to.be.eq(4);
        expect(stubOnInjectorGetComponent.calledWith('class token 1')).to.be.true;
        expect(stubOnInjectorGetComponent.calledWith('class token 2')).to.be.true;
        expect(postProcessor1.postProcessBeforeInit.calledTwice).to.be.true;
        expect(postProcessor2.postProcessBeforeInit.calledTwice).to.be.true;
        // cleanup
        stubOnGetOrderedPostProcessors.restore();
        stubOnGetActiveComponents.restore();
        stubOnGetComponentData.restore();
        stubOnInjectorGetComponent.restore();
    });

    it('should post process after init', async function () {
        // given
        let spy1 = spy();
        let spy2 = spy();
        let postProcessor1 = {
            postProcessAfterInit: spy1
        };
        let postProcessor2 = {
            postProcessAfterInit: spy2
        };
        let data1 = {
            classToken: 'class token 1'
        };
        let data2 = {
            classToken: 'class token 2'
        };
        let stubOnGetOrderedPostProcessors = stub(appContext, 'getOrderedPostProcessors')
            .returns([postProcessor1, postProcessor2]);
        let stubOnGetActiveComponents = stub(appContext, 'getActiveComponents').returns(['comp1', 'comp2']);
        let stubOnGetComponentData = stub(ComponentUtil, 'getComponentData');
        stubOnGetComponentData.withArgs('comp1').returns(data1);
        stubOnGetComponentData.withArgs('comp2').returns(data2);
        let stubOnInjectorGetComponent = stub(localAppContext.injector, 'getComponent');
        stubOnInjectorGetComponent.withArgs('class token 1').returns('instance1');
        stubOnInjectorGetComponent.withArgs('class token 2').returns('instance2');


        // when
        localAppContext.postProcessAfterInit();

        // then
        expect(stubOnGetOrderedPostProcessors.calledOnce).to.be.true;
        expect(stubOnGetActiveComponents.calledTwice).to.be.true;
        expect(stubOnGetComponentData.callCount).to.be.eq(4);
        expect(stubOnGetComponentData.calledWith('comp1')).to.be.true;
        expect(stubOnGetComponentData.calledWith('comp2')).to.be.true;
        expect(stubOnInjectorGetComponent.callCount).to.be.eq(4);
        expect(stubOnInjectorGetComponent.calledWith('class token 1')).to.be.true;
        expect(stubOnInjectorGetComponent.calledWith('class token 2')).to.be.true;
        expect(postProcessor1.postProcessAfterInit.calledTwice).to.be.true;
        expect(postProcessor2.postProcessAfterInit.calledTwice).to.be.true;
        // cleanup
        stubOnGetOrderedPostProcessors.restore();
        stubOnGetActiveComponents.restore();
        stubOnGetComponentData.restore();
        stubOnInjectorGetComponent.restore();
    });

    it('should get active post processors', async function () {
        // given
        let data1 = {
            profiles: ['dev']
        };
        let data2 = {
            profiles: ['other']
        };

        let data3 = {
            profiles: []
        };
        localAppContext.configurationData.componentPostProcessorFactory.components = ['comp1', 'comp2', 'comp3'];
        let stubOnGetActiveProfile = stub(localAppContext.environment, 'getActiveProfiles').returns(['dev']);
        let stubOnGetComponentData = stub(ComponentUtil, 'getComponentData');
        stubOnGetComponentData.withArgs('comp1').returns(data1);
        stubOnGetComponentData.withArgs('comp2').returns(data2);
        stubOnGetComponentData.withArgs('comp3').returns(data3);
        let stubOnOrderList = stub(OrderUtil, 'orderList').returns(['comp1', 'comp3']);

        // when
        let activePostProcessors = localAppContext.getActivePostProcessors();

        // then
        expect(activePostProcessors).to.be.eql(['comp1', 'comp3']);
        expect(stubOnOrderList.calledWith(['comp1', 'comp3'])).to.be.true;
        expect(stubOnGetComponentData.callCount).to.be.eq(3);
        expect(stubOnGetComponentData.calledWith('comp1')).to.be.true;
        expect(stubOnGetComponentData.calledWith('comp2')).to.be.true;
        expect(stubOnGetComponentData.calledWith('comp3')).to.be.true;
        // cleanup
        stubOnGetActiveProfile.restore();
        stubOnGetComponentData.restore();
        stubOnOrderList.restore();
    });

    it('should get ordered post processors', async function () {
        // given
        let data1 = {
            classToken: 'class token 1'
        };
        let data2 = {
            classToken: 'class token 2'
        };
        let stubOnGetActivePostProcessors = stub(appContext, 'getActivePostProcessors').returns(['comp1', 'comp2']);
        let stubOnGetComponentData = stub(ComponentUtil, 'getComponentData');
        stubOnGetComponentData.withArgs('comp1').returns(data1);
        stubOnGetComponentData.withArgs('comp2').returns(data2);
        let stubOnInjectorGetComponent = stub(localAppContext.injector, 'getComponent');
        stubOnInjectorGetComponent.withArgs('class token 1').returns('post processor 1');
        stubOnInjectorGetComponent.withArgs('class token 2').returns('post processor 2');

        // when
        let postProcessors = localAppContext.getOrderedPostProcessors();

        // then
        expect(stubOnGetActivePostProcessors.calledOnce).to.be.true;
        expect(stubOnGetComponentData.calledTwice).to.be.true;
        expect(stubOnGetComponentData.calledWith('comp1')).to.be.true;
        expect(stubOnGetComponentData.calledWith('comp2')).to.be.true;
        expect(stubOnInjectorGetComponent.calledTwice).to.be.true;
        expect(stubOnInjectorGetComponent.calledWith('class token 1')).to.be.true;
        expect(stubOnInjectorGetComponent.calledWith('class token 2')).to.be.true;
        expect(postProcessors).to.be.eql(['post processor 1', 'post processor 2']);
        // cleanup
        stubOnGetActivePostProcessors.restore();
        stubOnGetComponentData.restore();
        stubOnInjectorGetComponent.restore();
    });
});