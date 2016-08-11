import {expect} from "chai";
import {Interceptor, INTERCEPTOR_DECORATOR_TOKEN} from "../../../src/lib/interceptors/InterceptorDecorator";
import { ComponentUtil } from "../../../src/lib/decorators/ComponentDecorator";

@Interceptor()
class A {}

describe('InterceptorDecorator', function () {

    it('should add metadata', function () {
        // given / when
        let isInterceptor = A[INTERCEPTOR_DECORATOR_TOKEN];

        // then
        expect(isInterceptor).to.be.true;
        expect(ComponentUtil.isComponent(A)).to.be.true;
    });
});