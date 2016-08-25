import {expect} from "chai";
import {
    Component, ComponentUtil
} from "../../../src/lib/decorators/ComponentDecorator";
import {Qualifier} from "../../../src/lib/decorators/QualifierDecorator";
import { DecoratorUsageError } from "../../../src/lib/errors/DecoratorUsageErrors";

describe('QualifierDecorator', function () {

    it('should add the given token as alias token', function () {
        // given
        let tokenArray = [Symbol('tokenOne'), Symbol('tokenTwo')];
        @Qualifier(tokenArray[1])
        @Qualifier(tokenArray[0])
        @Component()
        class A {}

        // when
        let aliasTokensA = ComponentUtil.getAliasTokens(A);

        // then
        expect(aliasTokensA).to.eql(tokenArray);
    });

    it('should throw error if target is not a component', function () {
        // given
        function SomeDecorator(...args) {} // tslint:disable-line

        class MyClass {
            myProperty: string;
            @SomeDecorator
            myFunction(str: string) {} // tslint:disable-line
        }

        // when / then
        expect(Qualifier(Symbol('token')).bind(undefined, MyClass)).to.throw(DecoratorUsageError);
        expect(Qualifier(Symbol('token')).bind(undefined, MyClass.prototype,
            'myFunction', MyClass.prototype.myFunction)).to.throw(DecoratorUsageError);
        expect(Qualifier(Symbol('token')).bind(undefined, MyClass.prototype,
            'myProperty')).to.throw(DecoratorUsageError);
    });
});