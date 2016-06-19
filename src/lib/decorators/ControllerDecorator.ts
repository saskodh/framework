import {Component} from "./ComponentDecorator";
export const CONTROLLER_DECORATOR_TOKEN = Symbol('controller_decorator_token');

export function Controller(token?: Symbol) {
    return function (target) {
        Component(token)(target);
        target[CONTROLLER_DECORATOR_TOKEN] = true;
    }
}