import {Component} from "../decorators/ComponentDecorator";

export interface Interceptor {
    preHandle (request, response);
    postHandle (request, response);
}

export const INTERCEPTOR_DECORATOR_TOKEN = Symbol('interceptor_decorator_token');

export function Interceptor (token?: Symbol) {
    return function (target) {
        Component(token)(target);
        target[INTERCEPTOR_DECORATOR_TOKEN] = true;
    }
}