import {expect} from "chai";
import {stub, spy, match} from "sinon";
import {Router} from "express";
import {Dispatcher} from "../../../src/lib/web/Dispatcher";
import {Controller} from "../../../src/lib/decorators/ControllerDecorator";
import {RequestMapping, RequestMethod, RequestMappingUtil} from "../../../src/lib/decorators/RequestMappingDecorator";
import {View} from "../../../src/lib/decorators/ViewDecorator";
import { Interceptor } from "../../../src/lib/decorators/InterceptorDecorator";
import { InterceptorHandler } from "../../../src/lib/web/InterceptorHandler";

describe('Dispatcher', function () {

    let dispatcher;
    let router: Router;

    beforeEach(() => {
        dispatcher = new Dispatcher();
        router  = dispatcher.getRouter();
    });

    it('should initialize properly', async function () {
        // given
        let stubOnRegisterPreHandleMiddleware = stub(InterceptorHandler.prototype, 'registerPreHandleMiddleware');
        // when

        let myDispatcher = new Dispatcher();
        // then

        expect((<any> dispatcher).router).to.not.be.undefined;
        expect(router).to.be.equal((<any> dispatcher).router);
        expect((<any> myDispatcher).interceptorHandler).to.be.instanceOf(InterceptorHandler);
        expect(stubOnRegisterPreHandleMiddleware.calledOnce).to.be.true;

        stubOnRegisterPreHandleMiddleware.restore();
    });

    // TODO: add test for Promise.reject

    it('should post construct', async function () {
        // given
        let stubOnRouterUse = stub(router, 'use');
        let stubOnRegisterPostHandleMiddleware = stub(InterceptorHandler.prototype, 'registerPostHandleMiddleware');

        let stubOnInterceptorSort = stub((<any> dispatcher).interceptorHandler, 'sort');

        // when
        dispatcher.postConstruct();

        // then
        expect(stubOnRouterUse.calledOnce).to.be.true;
        expect(stubOnRouterUse.calledWith(dispatcher.resolveResponse)).to.be.true;
        expect(stubOnRegisterPostHandleMiddleware.calledWith(dispatcher.router)).to.be.true;
        expect(stubOnInterceptorSort.calledOnce).to.be.true;

        // cleanup
        stubOnRouterUse.restore();
        stubOnRegisterPostHandleMiddleware.restore();
        stubOnInterceptorSort.restore();
    });

    it('should register interceptors after init', async function () {
        // given
        @Interceptor()
        class A {}
        let stubOnRegisterInterceptor = stub((<any> dispatcher).interceptorHandler, 'registerInterceptor');
        let instanceofA = new A();

        // when
        dispatcher.processAfterInit(A, instanceofA);

        // then
        expect(stubOnRegisterInterceptor.calledWith(A, instanceofA)).to.be.true;

        stubOnRegisterInterceptor.restore();
    });

    it('should process after init controller', async function () {
        // given
        @RequestMapping({path: '/controller'})
        @Controller()
        class A {

            @RequestMapping({path: '/get', method: RequestMethod.GET})
            get(request, response): Promise<any> {
                return Promise.resolve('GET resolved');
            }

            @View('viewName')
            @RequestMapping({path: '/post', method: RequestMethod.POST})
            post(request, response): Promise<any> {
                return Promise.resolve('POST resolved');
            }
        }
        let instanceofA = new A();

        let spyOnValidRoutes = spy(RequestMappingUtil, 'getValidRoutes');
        let spyOnControllerPath = spy(RequestMappingUtil, 'getControllerRequestMappingPath');
        let spyOnRouterGet = stub(router, RequestMethod.GET);
        let spyOnRouterPost = stub(router, RequestMethod.POST);
        let mockResponseGet = {
            result: undefined,
            view: undefined
        };
        let mockResponsePost = {
            result: undefined,
            view: undefined
        };
        let spyOnControllerGet = spy(instanceofA, 'get');
        let spyOnControllerPost = spy(instanceofA, 'post');

        // when
        dispatcher.processAfterInit(A, instanceofA);
        let getRequestCallback = spyOnRouterGet.args[0][1];
        let postRequestCallback = spyOnRouterPost.args[0][1];

        await getRequestCallback('requestGET', mockResponseGet);
        await postRequestCallback('requestPOST', mockResponsePost);

        // then
        expect(spyOnValidRoutes.calledWith(A)).to.be.true;
        expect(spyOnControllerPath.calledWith(A)).to.be.true;
        expect(spyOnRouterGet.calledWith('/controller/get', match.func)).to.be.true;
        expect(spyOnRouterPost.calledWith('/controller/post', match.func)).to.be.true;
        expect(spyOnControllerGet.calledWith('requestGET', mockResponseGet)).to.be.true;
        expect(spyOnControllerPost.calledWith('requestPOST', mockResponsePost)).to.be.true;
        expect(mockResponseGet.result).to.be.eql('GET resolved');
        expect(mockResponseGet.view).to.be.undefined;
        expect(mockResponsePost.result).to.be.eql('POST resolved');
        expect(mockResponsePost.view).to.be.eql('viewName');

        // cleanup
        spyOnValidRoutes.restore();
        spyOnControllerPath.restore();
    });

    it('should resolve response', async function () {
        // given
        let spyOnNext = spy();
        let mockResponseGet = {
            result: 'getResult',
            view: undefined,
            json: spy(),
            render: spy()
        };
        let mockResponsePost = {
            result: 'postResult',
            view: 'postView',
            json: spy(),
            render: spy()
        };

        // when
        (<any> dispatcher).resolveResponse('mockRequest', mockResponseGet, spyOnNext);
        (<any> dispatcher).resolveResponse('mockRequest', mockResponsePost, spyOnNext);

        // then
        expect(mockResponseGet.json.calledWith('getResult')).to.be.true;
        expect(mockResponseGet.render.called).to.be.false;
        expect(mockResponsePost.json.called).to.be.false;
        expect(mockResponsePost.render.calledWith('postView', 'postResult')).to.be.true;
    });
});