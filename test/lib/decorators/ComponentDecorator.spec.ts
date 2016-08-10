import {expect} from "chai";
import {
    Component, ComponentData,
    ComponentUtil, Profile
} from "../../../src/lib/decorators/ComponentDecorator";
import {InjectionData} from "../../../src/lib/decorators/InjectionDecorators";
import {Controller} from "../../../src/lib/decorators/ControllerDecorator";
import {Interceptor} from "../../../src/lib/interceptors/InterceptorDecorator";
import { DecoratorUsageError } from "../../../src/lib/errors/DecoratorUsageError";

describe('ComponentDecorator', function () {

    it('should add metadata', function () {
        // given
        @Component()
        class A {}

        // when
        let componentData = ComponentUtil.getComponentData(A);

        // then
        expect(componentData).to.be.instanceOf(ComponentData);
        expect(componentData.classToken).to.be.a('symbol');
        expect(componentData.aliasTokens).to.be.eql([]);
        expect(componentData.injectionData).to.be.instanceOf(InjectionData);
        expect(componentData.profile).to.be.undefined;
    });
});

describe('ProfileDecorator', function () {

    it('should add metadata to Component classes', function () {
        // given
        @Profile('dev')
        @Component()
        class A {}

        // when
        let componentData = ComponentUtil.getComponentData(A);

        // then
        expect(componentData.profile).to.eq('dev');
    });

    it('should throw error when @Profile is used on non Component', function () {
        // given
        class B {}

        // when / then
        expect(Profile('dev').bind(this, B)).to.throw(DecoratorUsageError);
    });
});

describe('ComponentUtil', function () {

    it('should return if class is component', function () {
        // given
        @Component()
        class A {}
        class B {}

        // when / then
        expect(ComponentUtil.isComponent(A)).to.be.true;
        expect(ComponentUtil.isComponent(B)).to.be.false;
    });

    it('should get class token', function () {
        // given
        @Component()
        class A {}

        // when
        let classTokenA = ComponentUtil.getClassToken(A);

        // then
        expect(classTokenA).to.be.a('symbol');
        expect(classTokenA).to.eql(ComponentUtil.getComponentData(A).classToken);
    });

    it('should get alias tokens', function () {
        // given
        let tokenArray = [Symbol('tokenOne'), Symbol('tokenTwo')];

        @Component()
        class A {}

        ComponentUtil.getComponentData(A).aliasTokens = tokenArray;

        // when
        let aliasTokensA = ComponentUtil.getAliasTokens(A);

        // then
        expect(aliasTokensA).to.eql(tokenArray);
    });

    it('should get the injection data for the given target', function () {
        // given
        let givenInjectionData = new InjectionData();

        @Component()
        class A {}

        ComponentUtil.getComponentData(A).injectionData = givenInjectionData;

        // when
        let injectionData = ComponentUtil.getInjectionData(A);

        // then
        expect(injectionData).to.eql(givenInjectionData);
    });

    it('should return if instance is controller', function () {
        // given
        @Controller()
        class A {}

        @Component()
        class B {}

        class C {}

        // when / then
        expect(ComponentUtil.isController(A)).to.be.true;
        expect(ComponentUtil.isController(B)).to.be.false;
        expect(ComponentUtil.isController(C)).to.be.false;
    });

    it('should return if instance is interceptor', function () {
        // given
        @Interceptor()
        class A {}

        @Controller()
        class B {}

        class C {}

        // when / then
        expect(ComponentUtil.isInterceptor(A)).to.be.true;
        expect(ComponentUtil.isInterceptor(B)).to.be.false;
        expect(ComponentUtil.isInterceptor(C)).to.be.false;
    });
});