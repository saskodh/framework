import {Component} from "./ComponentDecorator";
export const CONTROLLER_DECORATOR_TOKEN = Symbol('controller_decorator_token');

export function Controller() {
    return function (target) {
        Component()(target);
        target[CONTROLLER_DECORATOR_TOKEN] = true;
    }
}