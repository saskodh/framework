import { stub } from "sinon";
import { expect } from "chai";
import { RequestContextHolder } from "../../../../src/lib/web/context/RequestContextHolder";
import { RESPONSE_TOKEN, REQUEST_TOKEN } from "../../../../src/lib/web/context/RequestContext";

describe('RequestContextHolder', function () {

    beforeEach(function () {
       this.currentZone = { get: stub() };
       (<any> global).Zone = { current: this.currentZone };
       this.givenInjector = { getComponent: stub() };
       this.stubOnGetInjector = stub(RequestContextHolder, 'getInjector').returns(this.givenInjector);
    });

    afterEach(function () {
       this.stubOnGetInjector.restore();
    });

    it('should get the request context from the current Zone', function () {
        // given
        this.currentZone.get.returns('request-context');

        // when / then
        expect(RequestContextHolder.get()).to.be.eq('request-context');
    });

    it('should throw if get called outside request context', function () {
        // given / when / then
        expect(RequestContextHolder.get).to.throw();
    });

    it('should return the request context injector', function () {
        let givenRequestContext = { getInjector: stub().returns('injector') };
        let stubOnGet = stub(RequestContextHolder, 'get').returns(givenRequestContext);
        this.stubOnGetInjector.restore();

        // when
        let injector = RequestContextHolder.getInjector();

        // then
        expect(injector).to.be.eq('injector');
        expect(stubOnGet.calledWith()).to.be.eq(true);

        // clean-up
        stubOnGet.restore();
    });

    it('should return the request from the request context', function () {
        // given
        this.givenInjector.getComponent.returns('request');

        // when
        let request = RequestContextHolder.getRequest();

        // then
        expect(request).to.be.eq('request');
        expect(this.givenInjector.getComponent.calledWith(REQUEST_TOKEN)).to.be.eq(true);
    });

    it('should return the response from the request context', function () {
        // given
        this.givenInjector.getComponent.returns('response');

        // when
        let response = RequestContextHolder.getResponse();

        // then
        expect(response).to.be.eq('response');
        expect(this.givenInjector.getComponent.calledWith(RESPONSE_TOKEN)).to.be.eq(true);
    });
});