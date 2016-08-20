import { stub, match } from "sinon";
import { expect } from "chai";
import { RequestContextInitializer } from "../../../../src/lib/web/context/RequestContextInitializer";
import { REQUEST_CONTEXT_TOKEN } from "../../../../src/lib/web/context/RequestContextHolder";
import { RequestContext } from "../../../../src/lib/web/context/RequestContext";

describe('RequestContextInitializer', function () {

    it('should return request context initializer middleware', function () {
        // given
        let givenZone = { run: stub() };
        let stubOnCreateRequestZone = stub(RequestContextInitializer, 'createRequestZone').returns(givenZone);

        // when
        let middleware = <any> RequestContextInitializer.getMiddleware();
        middleware('request', 'response', 'next');

        // then
        expect(stubOnCreateRequestZone.calledWith(match.instanceOf(RequestContext))).to.be.eq(true);
        expect(givenZone.run.calledWith('next')).to.be.eq(true);

        // clean-up
        stubOnCreateRequestZone.restore();
    });

    it('should create a zone in which the request handling will be run', function () {
        // given
        let currentZone: any = {};
        currentZone.fork = stub().returns(currentZone);
        (<any> global).Zone = {
            current: currentZone,
            longStackTraceZoneSpec: 'stacktrace-zone'
        };

        // when
        (<any> RequestContextInitializer).createRequestZone('request-context');

        // then
        let requestZoneSpec = currentZone.fork.args[0][0];
        expect(requestZoneSpec.name).to.be.eq(REQUEST_CONTEXT_TOKEN);
        expect(requestZoneSpec.properties[REQUEST_CONTEXT_TOKEN]).to.be.eq('request-context');
        expect(currentZone.fork.calledWith('stacktrace-zone')).to.be.eq(true);
    });

});