import { stub } from "sinon";
import { expect } from "chai";
import { RequestContextHolder } from "../../../src/lib/web/context/RequestContextHolder";
import { DynamicDependencyResolver } from "../../../src/lib/di/DynamicDependencyResolver";

describe('DynamicDependencyResolver', function () {

    beforeEach(function () {
        this.mainInjector = { getComponent: stub() };
        this.givenDependencyData = { isArray: false, token: 'given-token' };
        this.ddr = new DynamicDependencyResolver(this.mainInjector, this.givenDependencyData);
        this.pd = this.ddr.getPropertyDescriptor();

        this.requestInjector = { register: stub(), getComponent: stub() };
        this.stubOnGetInjector = stub(RequestContextHolder, 'getInjector').returns(this.requestInjector);
    });

    afterEach(function () {
        this.stubOnGetInjector.restore();
    });

    it('should return valid property descriptor', function () {
        // given / when / then
        expect(this.pd.enumerable).to.be.eq(true);
        expect(this.pd.configurable).to.be.eq(true);
        expect(this.pd.value).to.be.eq(undefined);
        expect(this.pd.writable).to.be.eq(undefined);
        expect(this.pd.get).to.be.instanceOf(Function);
        expect(this.pd.set).to.be.instanceOf(Function);
    });

    describe('fieldGetter', function () {
        it('should get dependency from RequestContext injector', function () {
            // given
            this.requestInjector.getComponent.returns('request-value');

            // when / then
            expect(this.pd.get()).to.be.eq('request-value');
        });

        it('should get dependency from the given injector as fallback', function () {
            // given
            this.requestInjector.getComponent.throws();
            this.mainInjector.getComponent.returns('main-value');

            // when / then
            expect(this.pd.get()).to.be.eq('main-value');
        });

        it('should return undefined if dependency not registered', function () {
            // given / when / then
            expect(this.pd.get()).to.be.eq(undefined);
        });

        it('should return empty array for not registered array dependencies', function () {
            // given
            this.givenDependencyData.isArray = true;

            // when
            let value = this.pd.get();

            // then
            expect(value).to.be.eql([]);
        });
    });

    it('should set dependency in the RequestContext injector', function () {
        // given / when
        this.pd.set('value');

        // then
        expect(this.requestInjector.register.calledWith('given-token', 'value')).to.be.eq(true);
    });

});