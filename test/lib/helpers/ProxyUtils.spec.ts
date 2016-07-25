import {expect} from "chai";
import {ProxyUtils} from "../../../src/lib/helpers/ProxyUtils";
import { spy } from "sinon";

describe('ProxyUtils', function () {

    it('should create proxy', function () {
        // given
        class A {

            originalMethod (arg1:number, arg2:number) {
                return arg1 - arg2;
            }
        }
        let a = new A();

        let spyOnProxyCallback = spy((methodRef, thisArg, args) => {
            return Reflect.apply(methodRef, thisArg, args);
        });

        // when
        let proxiedMethod: Function = ProxyUtils.createMethodProxy(a.originalMethod, spyOnProxyCallback);
        let result = proxiedMethod.call(a, 40, 10);

        // then
        expect(result).to.be.eq(30);
        expect(spyOnProxyCallback.called).to.be.true;
        expect(spyOnProxyCallback.calledWith(a.originalMethod, a, [40, 10])).to.be.true;
    });
});