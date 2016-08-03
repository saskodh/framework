import { expect } from "chai";
import { stub } from "sinon";
import { Router } from "express";
import { Dispatcher } from "../../../src/lib/web/Dispatcher";
import {
    RequestMappingUtil, RouterConfigItem
} from "../../../src/lib/decorators/RequestMappingDecorator";
import { Interceptor } from "../../../src/lib/decorators/InterceptorDecorator";
import { RouterConfigurer } from "../../../src/lib/web/RouterConfigurer";
import { Controller } from "../../../src/lib/decorators/ControllerDecorator";

describe('Dispatcher', function () {

    let dispatcher;
    let router: Router;

    beforeEach(() => {
        dispatcher = new Dispatcher();
        router = dispatcher.getRouter();
    });

    it('should initialize properly', async function () {
        // given / when
        let myDispatcher = new Dispatcher();

        // then
        expect((<any> dispatcher).router).to.not.be.undefined;
        expect(router).to.be.equal((<any> dispatcher).router);
        expect((<any> myDispatcher).routerConfigurer).to.be.instanceOf(RouterConfigurer);
    });

    // TODO: add test for Promise.reject

    it('should configure the router on post construct', async function () {
        // given
        let stubOnRegisterPostHandleMiddleware = stub(RouterConfigurer.prototype, 'configure');

        // when
        dispatcher.postConstruct();

        // then
        expect(stubOnRegisterPostHandleMiddleware.called).to.be.true;

        // cleanup
        stubOnRegisterPostHandleMiddleware.restore();
    });

    it('should register interceptors after init', async function () {
        // given
        @Interceptor()
        class A {
        }
        let stubOnRegisterInterceptor = stub((<any> dispatcher).routerConfigurer, 'registerInterceptor');
        let instanceofA = new A();

        // when
        dispatcher.processAfterInit(A, instanceofA);

        // then
        expect(stubOnRegisterInterceptor.calledWith(instanceofA)).to.be.true;

        stubOnRegisterInterceptor.restore();
    });

    it('should register route handlers after init', async function () {
        // given
        @Controller()
        class GivenCtrl {}

        let route1 = new RouterConfigItem({path: 'route1'}, 'handle1');
        let route2 = new RouterConfigItem({path: 'route2'}, 'handle2');
        let stubOnValidRoutes = stub(RequestMappingUtil, 'getValidRoutes').returns([route1, route2]);
        let stubOnControllerPath = stub(RequestMappingUtil, 'getControllerRequestMappingPath').returns('ctrlPrefix-');
        let stubOnRegisterHandler = stub((<any> dispatcher).routerConfigurer, 'registerHandler');

        // when
        dispatcher.processAfterInit(GivenCtrl, 'instance');

        // then
        expect(stubOnValidRoutes.calledWith(GivenCtrl)).to.be.true;
        expect(stubOnControllerPath.calledWith(GivenCtrl)).to.be.true;
        expect(stubOnRegisterHandler.calledWith(route1, 'instance')).to.be.true;
        expect(stubOnRegisterHandler.calledWith(route2, 'instance')).to.be.true;
        expect(route1.requestConfig.path).to.eql('ctrlPrefix-route1');
        expect(route2.requestConfig.path).to.eql('ctrlPrefix-route2');

        // cleanup
        stubOnValidRoutes.restore();
        stubOnControllerPath.restore();
        stubOnRegisterHandler.restore();
    });

});