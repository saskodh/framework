import { Component } from "./ComponentDecorator";
import { DecoratorUtil, DecoratorType } from "../helpers/DecoratorUtils";
import { StandaloneDecoratorMetadata } from "./common/DecoratorMetadata";
import { DecoratorHelper } from "./common/DecoratorHelper";

export function Controller() {
    return function (target) {
        DecoratorUtil.throwOnWrongType(Controller, DecoratorType.CLASS, [...arguments]);

        Component()(target);
        DecoratorHelper.setMetadata(target, Controller, new ControllerDecoratorMetadata());
    };
}
DecoratorHelper.createDecorator(Controller, DecoratorType.CLASS);

export class ControllerDecoratorMetadata extends StandaloneDecoratorMetadata<ControllerDecoratorMetadata> {

}