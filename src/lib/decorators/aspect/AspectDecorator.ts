import {Component} from "../ComponentDecorator";
import { DecoratorType, DecoratorUtil } from "../../helpers/DecoratorUtils";
import { DecoratorHelper } from "../common/DecoratorHelper";
import { StandaloneDecoratorMetadata } from "../common/DecoratorMetadata";

export function Aspect() {
    return function(target) {
        DecoratorUtil.throwOnWrongType(Aspect, DecoratorType.CLASS, [...arguments]);

        Component()(target);
        DecoratorHelper.setMetadata(target, Aspect, new AspectDecoratorMetadata());
    };
}
DecoratorHelper.createDecorator(Aspect, DecoratorType.CLASS);

export class AspectDecoratorMetadata extends StandaloneDecoratorMetadata<AspectDecoratorMetadata> {

}