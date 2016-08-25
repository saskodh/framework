import * as _ from "lodash";

const ORDER_DECORATOR_TOKEN = Symbol('order_decorator_token');

export function Order(orderValue: number) {
    return function(target) {
        target[ORDER_DECORATOR_TOKEN] = orderValue;
    };
}

export class OrderUtil {

    static getOrder (target) {
        return target[ORDER_DECORATOR_TOKEN];
    }

    static orderList (list): Array<any> {
        return _.sortBy(list, (element) => { return OrderUtil.getOrder(element) || Number.MAX_VALUE; });
    }
}