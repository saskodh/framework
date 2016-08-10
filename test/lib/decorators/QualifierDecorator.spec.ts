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
        class B {}

        // when / then
        expect(Qualifier(Symbol('token')).bind(this, B)).to.throw(DecoratorUsageError);
    });
});