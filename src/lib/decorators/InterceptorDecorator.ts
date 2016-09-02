import { Component } from "./ComponentDecorator";
import { DecoratorUtil, DecoratorType } from "../helpers/DecoratorUtils";
import { StandaloneDecoratorMetadata } from "./common/DecoratorMetadata";
import { DecoratorHelper } from "./common/DecoratorHelper";

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
        DecoratorHelper.setMetadata(target, Interceptor, new InterceptorDecoratorMetadata());
    };
}
DecoratorHelper.createDecorator(Interceptor, DecoratorType.CLASS);

export class InterceptorDecoratorMetadata extends StandaloneDecoratorMetadata<InterceptorDecoratorMetadata> {

}