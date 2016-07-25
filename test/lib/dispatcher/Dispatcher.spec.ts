import {expect} from "chai";
import {stub, spy, match} from "sinon";
import {Router} from "express";
import {Interceptor} from "../../../src/lib/interceptors/InterceptorDecorator";
import {Dispatcher} from "../../../src/lib/dispatcher/Dispatcher";
import {Controller} from "../../../src/lib/decorators/ControllerDecorator";
import {RequestMapping, RequestMethod, RequestMappingUtil} from "../../../src/lib/decorators/RequestMappingDecorator";
import {View} from "../../../src/lib/decorators/ViewDecorator";

describe('Dispatcher', function () {

    let dispatcher;
    let router: Router;

    beforeEach(() => {
        dispatcher = new Dispatcher();
        router  = dispatcher.getRouter();
    });

    it('should initialize properly', async function () {
        // given / when / then
        expect((<any> dispatcher).router).to.not.be.undefined;
        expect(router).to.be.equal((<any> dispatcher).router);
    });

    it('should process interceptors after init', async function () {
        // given
        @Interceptor()
        class A {
            preHandle(request, response): Promise<any> {
                return Promise.resolve('resolved');
            }
        }
        let instanceofA = new A();
        let spyOnRouterUse = stub(router, 'use');
        dispatcher.processAfterInit(A, instanceofA);
        let spyOnNext = spy();
        let spyOnPreHandle = spy(instanceofA, 'preHandle');
        let requestCallback = spyOnRouterUse.args[0][0];

        //when
        await requestCallback('request', 'response', spyOnNext);

        // then
        expect(spyOnRouterUse.called).to.be.true;
        expect(spyOnPreHandle.calledWith('request', 'response')).to.be.true;
        expect(spyOnNext.called).to.be.true;
    });

    //TODO: add test for Promise.reject

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
        let mockResponse = {
            json: spy(),
            render: spy()
        };
        let spyOnControllerGet = spy(instanceofA, 'get');
        let spyOnControllerPost = spy(instanceofA, 'post');

        // when
        dispatcher.processAfterInit(A, instanceofA);
        let getRequestCallback = spyOnRouterGet.args[0][1];
        let postRequestCallback = spyOnRouterPost.args[0][1];

        await getRequestCallback('requestGET', mockResponse);
        await postRequestCallback('requestPOST', mockResponse);

        // then
        expect(spyOnValidRoutes.calledWith(A)).to.be.true;
        expect(spyOnControllerPath.calledWith(A)).to.be.true;
        expect(spyOnRouterGet.calledWith('/controller/get', match.func)).to.be.true;
        expect(spyOnRouterPost.calledWith('/controller/post', match.func)).to.be.true;
        expect(spyOnControllerGet.calledWith('requestGET', mockResponse)).to.be.true;
        expect(spyOnControllerPost.calledWith('requestPOST', mockResponse)).to.be.true;
        expect(mockResponse.json.calledWith('GET resolved')).to.be.true;
        expect(mockResponse.render.calledWith('viewName', 'POST resolved')).to.be.true;

        //cleanup
        spyOnValidRoutes.restore();
        spyOnControllerPath.restore();
    });
});