import { expect } from "chai";
import {
    Component, ComponentData,
    ComponentUtil
} from "../../../src/lib/decorators/ComponentDecorator";
import { InjectionData } from "../../../src/lib/decorators/InjectionDecorators";
import { Controller } from "../../../src/lib/decorators/ControllerDecorator";
import { Interceptor } from "../../../src/lib/decorators/InterceptorDecorator";
import { ComponentPostProcessor } from "../../../src/lib/processors/ComponentPostProcessor";
import { ComponentDefinitionPostProcessor } from "../../../src/lib/processors/ComponentDefinitionPostProcessor";
import { DecoratorUsageError } from "../../../src/lib/errors/DecoratorUsageErrors";

class MyClass {
    myProperty: string;
    myFunction() {} // tslint:disable-line
}

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
        expect(componentData.profiles.length).to.be.eq(0);
    });

    it('should throw error when @Component is used more than once on the same class', function () {
        // given
        let createConfiguration = () => {
            @Component()
            @Component()
            class A {}
        };

        // when / then
        expect(createConfiguration).to.throw(DecoratorUsageError);
    });

    it('should throw when not on a class', function () {
        // given / when / then
        expect(Component().bind(undefined, MyClass, 'myFunction', MyClass.prototype.myFunction))
            .to.throw(DecoratorUsageError);
        expect(Component().bind(undefined, MyClass, 'myProperty')).to.throw(DecoratorUsageError);
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

    it('should return if instance is definition post processor', function () {
        // given
        @ComponentDefinitionPostProcessor()
        class A {}

        @Controller()
        class B {}

        class C {}

        // when / then
        expect(ComponentUtil.isComponentDefinitionPostProcessor(A)).to.be.true;
        expect(ComponentUtil.isComponentDefinitionPostProcessor(B)).to.be.false;
        expect(ComponentUtil.isComponentDefinitionPostProcessor(C)).to.be.false;
    });

    it('should return if instance is post processor', function () {
        // given
        @ComponentPostProcessor()
        class A {}

        @Controller()
        class B {}

        class C {}

        // when / then
        expect(ComponentUtil.isComponentPostProcessor(A)).to.be.true;
        expect(ComponentUtil.isComponentPostProcessor(B)).to.be.false;
        expect(ComponentUtil.isComponentPostProcessor(C)).to.be.false;
    });
});