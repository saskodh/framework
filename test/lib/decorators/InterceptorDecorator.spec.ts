import {expect} from "chai";
import {Interceptor, INTERCEPTOR_DECORATOR_TOKEN} from "../../../src/lib/decorators/InterceptorDecorator";
import { ComponentUtil } from "../../../src/lib/decorators/ComponentDecorator";
import { DecoratorUsageError } from "../../../src/lib/errors/DecoratorUsageErrors";

@Interceptor()
class A {}

class MyClass {
    myProperty: string;
    myFunction() {} // tslint:disable-line
}

describe('InterceptorDecorator', function () {

    it('should add metadata', function () {
        // given / when
        let isInterceptor = A[INTERCEPTOR_DECORATOR_TOKEN];

        // then
        expect(isInterceptor).to.be.true;
        expect(ComponentUtil.isComponent(A)).to.be.true;
    });

    it('should throw when not on a class', function () {
        // given / when / then
        expect(Interceptor().bind(undefined, MyClass, 'myFunction', MyClass.prototype.myFunction))
            .to.throw(DecoratorUsageError);
        expect(Interceptor().bind(undefined, MyClass, 'myProperty')).to.throw(DecoratorUsageError);
    });
});