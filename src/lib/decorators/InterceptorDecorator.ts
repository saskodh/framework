import { Component } from "./ComponentDecorator";
import { DecoratorUtil, DecoratorType } from "../helpers/DecoratorUtils";

export interface Interceptor {
    preHandle (request, response);
    postHandle (request, response);
    afterCompletion (request, response);
}

export const INTERCEPTOR_DECORATOR_TOKEN = Symbol('interceptor_decorator_token');

export function Interceptor() {
    return function (target) {
        DecoratorUtil.throwOnWrongType(Interceptor, DecoratorType.CLASS, [...arguments]);
        Component()(target);
        target[INTERCEPTOR_DECORATOR_TOKEN] = true;
    };
}