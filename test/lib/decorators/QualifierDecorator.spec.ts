import {expect} from "chai";
import {
    Component, ComponentUtil
} from "../../../src/lib/decorators/ComponentDecorator";
import {Qualifier} from "../../../src/lib/decorators/QualifierDecorator";
import { DecoratorUsageError } from "../../../src/lib/errors/DecoratorUsageError";

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
        class MyClass {
            myProperty: string;
            myFunction() {} // tslint:disable-line
        }

        // when / then
        expect(Qualifier(Symbol('token')).bind(undefined, MyClass)).to.throw(DecoratorUsageError);
        expect(Qualifier(Symbol('token')).bind(undefined, MyClass, 'myFunction', MyClass.prototype.myFunction))
            .to.throw(DecoratorUsageError);
        expect(Qualifier(Symbol('token')).bind(undefined, MyClass, 'myProperty')).to.throw(DecoratorUsageError);
    });
});