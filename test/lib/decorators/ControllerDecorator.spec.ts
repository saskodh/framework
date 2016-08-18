import {expect} from "chai";
import { DecoratorUsageError } from "../../../src/lib/errors/DecoratorUsageErrors";
import { Controller } from "../../../src/lib/decorators/ControllerDecorator";
import { ComponentUtil } from "../../../src/lib/decorators/ComponentDecorator";

describe('ControllerDecorator', function () {

    it('should add metadata', function () {
        // given / when
        @Controller()
        class A {}

        // then
        expect(ComponentUtil.isController(A)).to.be.true;
        expect(ComponentUtil.isComponent(A)).to.be.true;
    });

    it('should throw when not on a class', function () {
        // given
        class MyClass {
            myProperty: string;
            myFunction() {} // tslint:disable-line
        }

        // when / then
        expect(Controller().bind(undefined, MyClass, 'myFunction', MyClass.prototype.myFunction))
            .to.throw(DecoratorUsageError);
        expect(Controller().bind(undefined, MyClass, 'myProperty')).to.throw(DecoratorUsageError);
    });
});