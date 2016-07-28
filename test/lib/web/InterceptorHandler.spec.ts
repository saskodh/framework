import {expect} from "chai";
import {stub, spy} from "sinon";
import {Router} from "express";
import {Interceptor} from "../../../src/lib/decorators/InterceptorDecorator";
import { InterceptorHandler } from "../../../src/lib/web/InterceptorHandler";
import { Component } from "../../../src/lib/decorators/ComponentDecorator";
import { OrderUtil } from "../../../src/lib/decorators/OrderDecorator";

describe('InterceptorHandler', function () {

    class PreHandleInterceptor {
        preHandle() {} // tslint:disable-line
    }

    class PostHandleInterceptor {
        postHandle() {} // tslint:disable-line
    }

    let interceptorHandler: InterceptorHandler;
    let preHandleInterceptor: PreHandleInterceptor;
    let postHandleInterceptor: PostHandleInterceptor;
    beforeEach(() => {
        interceptorHandler = new InterceptorHandler();
        preHandleInterceptor = new PreHandleInterceptor();
        postHandleInterceptor = new PostHandleInterceptor();
    });

    it('should initialize properly', async function () {
        // given / when / then
        expect((<any> interceptorHandler).interceptors).to.eql([]);
    });

    it('should register pre handlers', async function () {
        // given
        let router = Router();
        let stubOnUse = stub(router, 'use');
        let stubOnInterceptorPreHandler = stub((<any> interceptorHandler).preHandler, 'bind')
            .returns('bound preHandler');

        // when
        interceptorHandler.registerPreHandleMiddleware(router);

        // then
        expect(stubOnUse.calledWith('bound preHandler')).to.be.true;
        expect(stubOnInterceptorPreHandler.calledWith(interceptorHandler)).to.be.true;

        stubOnUse.restore();
        stubOnInterceptorPreHandler.restore();
    });

    it('should register post handlers', async function () {
        // given
        let router = Router();
        let stubOnUse = stub(router, 'use');
        let stubOnInterceptorPostHandler = stub((<any> interceptorHandler).postHandler, 'bind')
            .returns('bound postHandler');

        // when
        interceptorHandler.registerPostHandleMiddleware(router);

        // then
        expect(stubOnUse.calledWith('bound postHandler')).to.be.true;
        expect(stubOnInterceptorPostHandler.calledWith(interceptorHandler)).to.be.true;

        stubOnUse.restore();
        stubOnInterceptorPostHandler.restore();
    });

    it('should register interceptors', async function () {
        // given
        @Interceptor()
        class A {}
        @Component()
        class B {}

        let instanceA = new A();
        let instanceB = new B();

        // when
        interceptorHandler.registerInterceptor(A, instanceA);
        interceptorHandler.registerInterceptor(B, instanceB);

        // then
        expect((<any> interceptorHandler).interceptors.length).to.be.eql(1);
        expect((<any> interceptorHandler).interceptors).to.include(instanceA);
    });

    it('should sort', async function () {
        // given
        let stubOnOrderList = stub(OrderUtil, 'orderList').returns(['firstInterceptor', 'secondInterceptor']);

        // when
        interceptorHandler.sort();

        // then
        expect(stubOnOrderList.calledOnce).to.be.true;
        expect(stubOnOrderList.calledWith([])).to.be.true;
        expect((<any> interceptorHandler).interceptors).to.eql(['firstInterceptor', 'secondInterceptor']);
    });

    it('should pre handle', async function () {
        // given
        let spyOnPreHandle = spy(preHandleInterceptor, 'preHandle');
        let spyOnPostHandle = spy(postHandleInterceptor, 'postHandle');
        let spyOnNext = spy();
        (<any> interceptorHandler).interceptors.push(preHandleInterceptor);
        (<any> interceptorHandler).interceptors.push(postHandleInterceptor);

        // when
        (<any> interceptorHandler).preHandler('request', 'response', spyOnNext);

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
        (<any> interceptorHandler).interceptors.push(preHandleInterceptor);
        (<any> interceptorHandler).interceptors.push(postHandleInterceptor);

        // when
        (<any> interceptorHandler).postHandler('request', 'response', spyOnNext);

        // then
        expect(spyOnNext.calledOnce).to.be.true;
        expect(spyOnPreHandle.called).to.not.be.true;
        expect(spyOnPostHandle.calledOnce).to.be.true;

        spyOnPreHandle.restore();
        spyOnPostHandle.restore();
    });
});