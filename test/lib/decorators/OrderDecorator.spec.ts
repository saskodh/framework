import { expect } from "chai";
import { Order, OrderUtil } from "../../../src/lib/decorators/OrderDecorator";

describe('OrderDecorator', function () {

    it('should add metadata', function () {
        // given
        @Order(1)
        class A {}

        // when
        let orderValue = OrderUtil.getOrder(A);

        // then
        expect(orderValue).to.be.eq(1);
    });
});

describe('OrderUtil', function () {

    it('should return metadata', function () {
        // given
        @Order(1)
        class A {}

        class B {}

        // when / then
        expect(OrderUtil.getOrder(A)).to.be.eq(1);
        expect(OrderUtil.getOrder(B)).to.be.undefined;
    });

    it('should order given list according to the value passed with the @Order decorator', function () {
        // given
        @Order(5)
        class A {}

        @Order(1)
        class B {}

        class C {}
        let list = [A, B, C];

        // when
        let orderedList = OrderUtil.orderList(list);

        // then
        expect(orderedList).to.be.eql([B, A, C]);
    });
});