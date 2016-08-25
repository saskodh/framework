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
} from "../../../src/lib/processors/CacheDefinitionPostProcessor";
import {
    ComponentPostProcessorUtil
} from "../../../src/lib/processors/ComponentPostProcessor";
import { LifeCycleHooksUtil } from "../../../src/lib/decorators/LifeCycleHooksDecorators";
import { ActiveProfiles } from "../../../src/lib/decorators/ProfileDecorators";
import { Environment } from "../../../src/lib/di/Environment";
import { AspectDefinitionPostProcessor } from "../../../src/lib/processors/aspect/AspectDefinitionPostProcessor";
import { CacheDefinitionPostProcessor } from "../../../src/lib/processors/cache/CacheDefinitionPostProcessor";

describe('ApplicationContext', function () {

    let appContext: ApplicationContext;
    let localAppContext;

    @ActiveProfiles('dev')
    @Configuration()
    class AppConfig {}

    beforeEach(() => {
        appContext = new ApplicationContext(AppConfig);
        localAppContext = <any> appContext;

        let configData = ConfigurationUtil.getConfigurationData(AppConfig);
        configData.componentDefinitionPostProcessorFactory.components.push(CacheDefinitionPostProcessor);
    });

    afterEach(() => {
        let configData = ConfigurationUtil.getConfigurationData(AppConfig);
        configData.componentDefinitionPostProcessorFactory.components = [];
    });

    it('should initialize properly', function () {
        // given
        @ActiveProfiles('dev')
        @Configuration()
        class AppConfig2 {}

        let localAppData = ConfigurationUtil.getConfigurationData(AppConfig2);

        let stubOnGetConfigurationData = stub(ConfigurationUtil, 'getConfigurationData')
            .returns(localAppData);
        let stubOnLoadAllComponents = stub(localAppData, 'loadAllComponents');
        let stubOnSetActiveProfiles = stub(Environment.prototype, 'setActiveProfiles');
        let stubOnSetApplicationProperties = stub(Environment.prototype, 'setApplicationProperties');
        let stubOnRegister = stub(Injector.prototype, 'register');

        // when
        localAppContext = <any> new ApplicationContext(AppConfig2);

        // then
        expect(localAppContext.state).to.be.eq(ApplicationContextState.NOT_INITIALIZED);
        expect(localAppContext.injector).to.be.instanceOf(Injector);
        expect(localAppContext.dispatcher).to.be.instanceOf(Dispatcher);
        expect(stubOnGetConfigurationData.calledWith(AppConfig2)).to.be.true;
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

    it('should wire the aspectDefinitionPostProcessor', async function () {
        // given
        let stub1 = stub();
        let stub2 = stub();
        let aspectDefinitionPostProcessor = {
            setInjector: stub1,
            setAspectComponentDefinitions: stub2
        };
        let activeAspects = ['aspect1', 'aspects'];
        let stubOnGetClassToken = stub(ComponentUtil, 'getClassToken');
        stubOnGetClassToken.withArgs(AspectDefinitionPostProcessor).returns('aspect_token');
        let stubOnInjectorGetComponent = stub(localAppContext.injector, 'getComponent');
        stubOnInjectorGetComponent.withArgs('aspect_token').returns(aspectDefinitionPostProcessor);
        let stubOnGetActiveAspects = stub(appContext, 'getActiveAspects').returns(activeAspects);

        // when
        localAppContext.wireAspectDefinitionPostProcessor();

        // then
        expect(stubOnGetClassToken.callCount).to.be.eq(1);
        expect(stubOnGetClassToken.calledWith(AspectDefinitionPostProcessor)).to.be.true;
        expect(stubOnInjectorGetComponent.callCount).to.be.eq(1);
        expect(stubOnInjectorGetComponent.calledWith('aspect_token')).to.be.true;
        expect(stub1.callCount).to.be.eq(1);
        expect(stub1.calledWith(localAppContext.injector)).to.be.true;
        expect(stub2.callCount).to.be.eq(1);
        expect(stub2.calledWith(activeAspects)).to.be.true;
        expect(stubOnGetActiveAspects.callCount).to.be.eq(1);

        // cleanup
        stubOnGetClassToken.restore();
        stubOnInjectorGetComponent.restore();
        stubOnGetActiveAspects.restore();
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

    describe('wiring components', function () {

        let givenComponentData = { classToken : 'class token' };

        let dependencyData1 = { token: 'token 1', isArray: false };
        let dependencyData2 = { token: 'token 2', isArray: true };
        let dynamicDepData1 = { token: 'dtoken 1', isArray: false };
        let dynamicDepData2 = { token: 'dtoken 2', isArray: true };

        let mockInjectionData = {
            dependencies: new Map([['d1', dependencyData1], ['d2', dependencyData2]]),
            dynamicDependencies: new Map([['dd1', dynamicDepData1], ['dd2', dynamicDepData2]]),
            properties: new Map([['p1', 'p.name']])
        };

        beforeEach(function () {
            this.givenInjectionData = { dependencies: new Map(), dynamicDependencies: new Map(), properties: new Map()};

            this.stubOnGetActiveComponents = stub(appContext, 'getActiveComponents').returns(['comp1']);
            this.stubOnGetComponentData = stub(ComponentUtil, 'getComponentData').returns(givenComponentData);
            this.stubOnGetInjectionData = stub(ComponentUtil, 'getInjectionData').returns(this.givenInjectionData);
            this.stubOnGetComponent = stub(localAppContext.injector, 'getComponent').returns('instance 1');
            this.stubOnReflectSet = stub(Reflect, 'set');
        });

        afterEach(function () {
            this.stubOnGetActiveComponents.restore();
            this.stubOnGetComponentData.restore();
            this.stubOnGetInjectionData.restore();
            this.stubOnGetComponent.restore();
            this.stubOnReflectSet.restore();
        });

        it('should wire dependencies', async function () {
            // given
            this.givenInjectionData.dependencies = mockInjectionData.dependencies;

            this.stubOnGetComponent.withArgs('class token').returns('instance 1');
            this.stubOnGetComponent.withArgs('token 1').returns('injected instance 1');
            let stubOnGetComponents = stub(localAppContext.injector, 'getComponents');
            stubOnGetComponents.withArgs('token 2').returns(['injected instance 2', 'injected instance 3']);

            // when
            await localAppContext.wireComponents();

            // then
            expect(this.stubOnGetActiveComponents.calledOnce).to.be.eq(true);
            expect(this.stubOnGetComponentData.calledWith('comp1')).to.be.eq(true);
            expect(this.stubOnGetInjectionData.calledWith('comp1')).to.be.eq(true);
            expect(this.stubOnGetComponent.calledWith('class token')).to.be.eq(true);
            expect(this.stubOnGetComponent.calledWith('token 1')).to.be.eq(true);
            expect(stubOnGetComponents.calledWith('token 2')).to.be.eq(true);
            expect(this.stubOnReflectSet.calledWith('instance 1', 'd1', 'injected instance 1')).to.be.eq(true);
            expect(this.stubOnReflectSet.calledWith('instance 1', 'd2', ['injected instance 2', 'injected instance 3']))
                .to.be.eq(true);

            // clean-up
            stubOnGetComponents.restore();
        });

        it('should wire dynamic dependencies', async function () {
            // given
            this.givenInjectionData.dynamicDependencies = mockInjectionData.dynamicDependencies;
            let stubOnObjectDefineProperty = stub(Object, 'defineProperty');

            // when
            await localAppContext.wireComponents();

            // then
            expect(stubOnObjectDefineProperty.calledWith('instance 1', 'dd1', match.any)).to.be.eq(true);
            expect(stubOnObjectDefineProperty.calledWith('instance 1', 'dd2', match.any)).to.be.eq(true);
            // clean-up
            stubOnObjectDefineProperty.restore();
        });

        it('should wire properties', async function () {
            // given
            this.givenInjectionData.properties = mockInjectionData.properties;

            let stubOnEnvironmentGetProperty = stub(Environment.prototype, 'getProperty').returns('value 1');

            // when
            await localAppContext.wireComponents();

            // then
            expect(this.stubOnReflectSet.calledWith('instance 1', 'p1', 'value 1')).to.be.eq(true);
            expect(stubOnEnvironmentGetProperty.calledWith('p.name')).to.be.eq(true);

            // clean-up
            stubOnEnvironmentGetProperty.restore();
        });

        it('should process after init', async function () {
            // given
            let stubOnProcessAfterInit = stub(Dispatcher.prototype, 'processAfterInit');

            // when
            await localAppContext.wireComponents();

            // then
            expect(stubOnProcessAfterInit.calledWith('comp1', 'instance 1')).to.be.eq(true);

            // clean-up
            stubOnProcessAfterInit.restore();
        });

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
            profiles: ['other']
        };
        let data3 = {
            profiles: []
        };
        localAppContext.configurationData.componentFactory.components = ['comp1', 'comp2', 'comp3'];
        let stubOnAcceptsProfiles = stub(localAppContext.environment, 'acceptsProfiles').returns(false);
        stubOnAcceptsProfiles.withArgs('dev').returns(true);
        let stubOnGetComponentData = stub(ComponentUtil, 'getComponentData');
        stubOnGetComponentData.withArgs('comp1').returns(data1);
        stubOnGetComponentData.withArgs('comp2').returns(data2);
        stubOnGetComponentData.withArgs('comp3').returns(data3);

        // when
        let activeComponents = localAppContext.getActiveComponents();

        // then
        expect(activeComponents).to.be.eql(['comp1', 'comp3']);
        expect(stubOnGetComponentData.callCount).to.be.eq(3);
        expect(stubOnGetComponentData.calledWith('comp1')).to.be.true;
        expect(stubOnGetComponentData.calledWith('comp2')).to.be.true;
        expect(stubOnGetComponentData.calledWith('comp3')).to.be.true;
        expect(stubOnAcceptsProfiles.callCount).to.be.eq(2);
        expect(stubOnAcceptsProfiles.calledWith('dev')).to.be.true;
        expect(stubOnAcceptsProfiles.calledWith('other')).to.be.true;

        // cleanup
        stubOnAcceptsProfiles.restore();
        stubOnGetComponentData.restore();
    });

    it('should get active aspects', async function () {
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
        localAppContext.configurationData.componentFactory.components = ['comp1', 'comp2', 'comp3'];
        let stubOnIsAspect = stub(ComponentUtil, 'isAspect');
        stubOnIsAspect.withArgs('comp1').returns(false);
        stubOnIsAspect.withArgs('comp2').returns(true);
        stubOnIsAspect.withArgs('comp3').returns(true);
        let stubOnAcceptsProfiles = stub(localAppContext.environment, 'acceptsProfiles').returns(false);
        stubOnAcceptsProfiles.withArgs('dev').returns(true);
        let stubOnGetComponentData = stub(ComponentUtil, 'getComponentData');
        stubOnGetComponentData.withArgs('comp1').returns(data1);
        stubOnGetComponentData.withArgs('comp2').returns(data2);
        stubOnGetComponentData.withArgs('comp3').returns(data3);

        // when
        let activeComponents = localAppContext.getActiveAspects();

        // then
        expect(activeComponents).to.be.eql(['comp3']);
        expect(stubOnGetComponentData.callCount).to.be.eq(2);
        expect(stubOnGetComponentData.calledWith('comp2')).to.be.true;
        expect(stubOnGetComponentData.calledWith('comp3')).to.be.true;
        expect(stubOnAcceptsProfiles.callCount).to.be.eq(1);
        expect(stubOnAcceptsProfiles.calledWith('other')).to.be.true;

        // cleanup
        stubOnAcceptsProfiles.restore();
        stubOnGetComponentData.restore();
        stubOnIsAspect.restore();
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
        let spyOnComponentDefinitionPostProcessorFactory =
            spy(localAppContext.configurationData.componentDefinitionPostProcessorFactory.components, 'push');
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
        let stubOnWireAspectDefinitionPostProcessor = stub(appContext, 'wireAspectDefinitionPostProcessor');
        let stubOnWireCacheDefinitionPostProcessor = stub(appContext, 'wireCacheDefinitionPostProcessor');
        let instance1 = new DefinitionPostProcessor1();
        let instance2 = new DefinitionPostProcessor2();

        // when
        localAppContext.initializeDefinitionPostProcessors();

        // then
        expect(spyOnComponentDefinitionPostProcessorFactory.calledWith(AspectDefinitionPostProcessor)).to.be.true;
        expect(stubOnGetActiveDefinitionPostProcessors.calledOnce).to.be.true;
        expect(stubOnGetComponentData.calledWith(DefinitionPostProcessor1)).to.be.true;
        expect(stubOnGetComponentData.calledWith(DefinitionPostProcessor2)).to.be.true;
        expect(stubOnInjectorRegister.calledWith('class token 1', instance1)).to.be.true;
        expect(stubOnInjectorRegister.calledWith('class token 2', instance2)).to.be.true;
        expect(stubOnInjectorRegister.calledWith('alias1', instance1)).to.be.true;
        expect(stubOnInjectorRegister.calledWith('alias2', instance2)).to.be.true;
        expect(stubOnIsComponentDefinitionPostProcessor.calledTwice).to.be.true;
        // cleanup
        spyOnComponentDefinitionPostProcessorFactory.restore();
        stubOnGetActiveDefinitionPostProcessors.restore();
        stubOnGetComponentData.restore();
        stubOnNewComponent1.restore();
        stubOnNewComponent2.restore();
        stubOnInjectorRegister.restore();
        stubOnIsComponentDefinitionPostProcessor.restore();
        stubOnWireAspectDefinitionPostProcessor.restore();
        stubOnWireCacheDefinitionPostProcessor.restore();
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
        let stubOnAcceptsProfiles = stub(localAppContext.environment, 'acceptsProfiles').returns(false);
        stubOnAcceptsProfiles.withArgs('dev').returns(true);
        let stubOnGetComponentData = stub(ComponentUtil, 'getComponentData');
        stubOnGetComponentData.withArgs('comp1').returns(data1);
        stubOnGetComponentData.withArgs('comp2').returns(data2);
        stubOnGetComponentData.withArgs('comp3').returns(data3);

        // when
        let activeComponents = localAppContext.getActiveDefinitionPostProcessors();

        // then
        expect(activeComponents).to.be.eql(['comp1', 'comp3']);
        expect(stubOnGetComponentData.callCount).to.be.eq(3);
        expect(stubOnGetComponentData.calledWith('comp1')).to.be.true;
        expect(stubOnGetComponentData.calledWith('comp2')).to.be.true;
        expect(stubOnGetComponentData.calledWith('comp3')).to.be.true;
        expect(stubOnAcceptsProfiles.callCount).to.be.eq(2);
        expect(stubOnAcceptsProfiles.calledWith('dev')).to.be.true;
        expect(stubOnAcceptsProfiles.calledWith('other')).to.be.true;

        // cleanup
        stubOnAcceptsProfiles.restore();
        stubOnGetComponentData.restore();
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
        let stubOnAcceptsProfiles = stub(localAppContext.environment, 'acceptsProfiles').returns(false);
        stubOnAcceptsProfiles.withArgs('dev').returns(true);
        let stubOnGetComponentData = stub(ComponentUtil, 'getComponentData');
        stubOnGetComponentData.withArgs('comp1').returns(data1);
        stubOnGetComponentData.withArgs('comp2').returns(data2);
        stubOnGetComponentData.withArgs('comp3').returns(data3);

        // when
        let activeComponents = localAppContext.getActivePostProcessors();

        // then
        expect(activeComponents).to.be.eql(['comp1', 'comp3']);
        expect(stubOnGetComponentData.callCount).to.be.eq(3);
        expect(stubOnGetComponentData.calledWith('comp1')).to.be.true;
        expect(stubOnGetComponentData.calledWith('comp2')).to.be.true;
        expect(stubOnGetComponentData.calledWith('comp3')).to.be.true;
        expect(stubOnAcceptsProfiles.callCount).to.be.eq(2);
        expect(stubOnAcceptsProfiles.calledWith('dev')).to.be.true;
        expect(stubOnAcceptsProfiles.calledWith('other')).to.be.true;

        // cleanup
        stubOnAcceptsProfiles.restore();
        stubOnGetComponentData.restore();
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