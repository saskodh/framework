import * as _ from "lodash";
import { DecoratorHelper } from "./common/DecoratorHelper";
import { DecoratorType } from "../helpers/DecoratorUtils";
import { StandaloneDecoratorMetadata } from "./common/DecoratorMetadata";

export function Order(orderValue: number) {
    return function(target) {
        let orderDecoratorMetadata = DecoratorHelper.getOwnMetadata(target, Order, new OrderDecoratorMetadata());
        orderDecoratorMetadata.orderValue = orderValue;
        DecoratorHelper.setMetadata(target, Order, orderDecoratorMetadata);
    };
}
DecoratorHelper.createDecorator(Order, DecoratorType.CLASS);

export class OrderDecoratorMetadata extends StandaloneDecoratorMetadata<OrderDecoratorMetadata> {
    orderValue: number;

    constructor() {
        super();
        this.orderValue = Number.MIN_VALUE;
    }
}

export class OrderUtil {

    static getOrder (target) {
        let orderDecoratorMetadata = DecoratorHelper.getOwnMetadata<OrderDecoratorMetadata>(target, Order);
        if (!orderDecoratorMetadata) {
            return  Number.MAX_VALUE;
        }
        return orderDecoratorMetadata.orderValue;
    }

    static orderList (list): Array<any> {
        return _.sortBy(list, (element) => { return OrderUtil.getOrder(element) || Number.MAX_VALUE; });
    }
}