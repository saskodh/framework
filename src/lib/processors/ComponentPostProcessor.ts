import { Component } from "../decorators/ComponentDecorator";
import { DecoratorType, DecoratorUtil } from "../helpers/DecoratorUtils";

export interface IComponentPostProcessor {
    postProcessBeforeInit (componentConstructor);
    postProcessAfterInit (componentConstructor);
}

export const COMPONENT_POST_PROCESSOR_DECORATOR_TOKEN =
    Symbol('component_definition_post_processor_decorator_token');

export function ComponentPostProcessor() {
    return function (target) {
        DecoratorUtil.throwOnWrongType("@ComponentPostProcessor",
            DecoratorType.CLASS, Array.prototype.slice.call(arguments));
        Component()(target);
        target[COMPONENT_POST_PROCESSOR_DECORATOR_TOKEN] = true;
    };
}

export class ComponentPostProcessorUtil {

    static isIComponentPostProcessor(arg: any): arg is IComponentPostProcessor {
        return (arg.postProcessBeforeInit !== undefined) && (arg.postProcessAfterInit !== undefined);
    }
}
