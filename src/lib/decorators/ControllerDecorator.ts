import { Component } from "./ComponentDecorator";
import { DecoratorUsageError } from "../errors/DecoratorUsageError";
import { DecoratorUtil, DecoratorType } from "../helpers/DecoratorUtils";
export const CONTROLLER_DECORATOR_TOKEN = Symbol('controller_decorator_token');

export function Controller() {
    return function (target) {
        if (!DecoratorUtil.isType(DecoratorType.CLASS, Array.prototype.slice.call(arguments))) {
            let subjectName = DecoratorUtil.getSubjectName(Array.prototype.slice.call(arguments));
            throw new DecoratorUsageError(`@Configuration can be set only on classes! (${subjectName})`);
        }
        Component()(target);
        target[CONTROLLER_DECORATOR_TOKEN] = true;
    };
}