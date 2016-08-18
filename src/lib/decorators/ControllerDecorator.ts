import { Component } from "./ComponentDecorator";
import { DecoratorUtil, DecoratorType } from "../helpers/DecoratorUtils";
export const CONTROLLER_DECORATOR_TOKEN = Symbol('controller_decorator_token');

export function Controller() {
    return function (target) {
        DecoratorUtil.throwOnWrongType("@Controller", DecoratorType.CLASS, Array.prototype.slice.call(arguments));
        Component()(target);
        target[CONTROLLER_DECORATOR_TOKEN] = true;
    };
}