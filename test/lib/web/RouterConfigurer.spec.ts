import { expect } from "chai";
import { stub, spy } from "sinon";
import { Router } from "express";
import { Interceptor } from "../../../src/lib/decorators/InterceptorDecorator";
import { RouterConfigurer } from "../../../src/lib/web/RouterConfigurer";
import { OrderUtil } from "../../../src/lib/decorators/OrderDecorator";

// TODO #28: add missing tests
describe('RouterConfigurer', function () {

    @Interceptor()
    class PreHandleInterceptor implements Interceptor {
        preHandle() {} // tslint:disable-line
        postHandle(request, response) {} // tslint:disable-line
    }

    @Interceptor()
    class PostHandleInterceptor implements Interceptor {
        preHandle(request, response) {} // tslint:disable-line
        postHandle() {} // tslint:disable-line
    }

    let router: Router;
    let routerConfigurer: RouterConfigurer;
    let preHandleInterceptor: PreHandleInterceptor;
    let postHandleInterceptor: PostHandleInterceptor;

    beforeEach(() => {
        router = Router();
        routerConfigurer = new RouterConfigurer(router);
        preHandleInterceptor = new PreHandleInterceptor();
        postHandleInterceptor = new PostHandleInterceptor();
    });

    it('should initialize properly', async function () {
        // given / when / then
        expect((<any> routerConfigurer).interceptors).to.eql([]);
    });

    it('should register interceptors', async function () {
        // given
        let instanceA = new PreHandleInterceptor();
        let instanceB = new PostHandleInterceptor();

        // when
        routerConfigurer.registerInterceptor(instanceA);
        routerConfigurer.registerInterceptor(instanceB);

        // then
        expect((<any> routerConfigurer).interceptors.length).to.be.eql(2);
        expect((<any> routerConfigurer).interceptors).to.include(instanceA);
        expect((<any> routerConfigurer).interceptors).to.include(instanceB);
    });

    it('should configure the router', async function () {
        // given
        let stubOnOrderList = stub(OrderUtil, 'orderList').returns(['firstInterceptor', 'secondInterceptor']);

        // when
        routerConfigurer.configure();

        // then
        expect(stubOnOrderList.calledOnce).to.be.true;
        expect(stubOnOrderList.calledWith([])).to.be.true;
        expect((<any> routerConfigurer).interceptors).to.eql(['firstInterceptor', 'secondInterceptor']);
    });

    it('should pre handle', async function () {
        // given
        let spyOnPreHandle = spy(preHandleInterceptor, 'preHandle');
        let spyOnPostHandle = spy(postHandleInterceptor, 'postHandle');
        let spyOnNext = spy();
        (<any> routerConfigurer).interceptors.push(preHandleInterceptor);
        (<any> routerConfigurer).interceptors.push(postHandleInterceptor);

        // when
        await (<any> routerConfigurer).preHandler('request', 'response', spyOnNext);

        // then
        expect(spyOnNext.calledOnce).to.be.true;
        expect(spyOnPreHandle.calledOnce).to.be.true;
        expect(spyOnPostHandle.called).to.not.be.true;

        spyOnPreHandle.restore();
        spyOnPostHandle.restore();
    });

    it('should post handle', async function () {
        // given
        let spyOnPreHandle = spy(preHandleInterceptor, 'preHandle');
        let spyOnPostHandle = spy(postHandleInterceptor, 'postHandle');
        let spyOnNext = spy();
        (<any> routerConfigurer).interceptors.push(preHandleInterceptor);
        (<any> routerConfigurer).interceptors.push(postHandleInterceptor);

        // when
        await (<any> routerConfigurer).postHandler('request', 'response', spyOnNext);

        // then
        expect(spyOnNext.calledOnce).to.be.true;
        expect(spyOnPreHandle.called).to.not.be.true;
        expect(spyOnPostHandle.calledOnce).to.be.true;

        spyOnPreHandle.restore();
        spyOnPostHandle.restore();
    });
});