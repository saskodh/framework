import {Component} from "../decorators/ComponentDecorator";

export interface ComponentPostProcessor {
    postProcessBeforeInit (componentConstructor);
    postProcessAfterInit (componentConstructor);
}

export const COMPONENT_POST_PROCESSOR_DECORATOR_TOKEN =
    Symbol('component_definition_post_processor_decorator_token');

export function ComponentPostProcessor () {
    return function (target) {
        Component()(target);
        target[COMPONENT_POST_PROCESSOR_DECORATOR_TOKEN] = true;
    }
}
