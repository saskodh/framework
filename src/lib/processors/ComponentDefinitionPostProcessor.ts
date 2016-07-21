import { Component } from "../decorators/ComponentDecorator";

export interface ComponentDefinitionPostProcessor {
    postProcessDefinition (componentConstructor: any): any;
}

export const COMPONENT_DEFINITION_POST_PROCESSOR_DECORATOR_TOKEN =
    Symbol('component_definition_post_processor_decorator_token');

export function ComponentDefinitionPostProcessor() {
    return function (target) {
        Component()(target);
        target[COMPONENT_DEFINITION_POST_PROCESSOR_DECORATOR_TOKEN] = true;
    };
}