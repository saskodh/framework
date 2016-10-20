import { DecoratorUsageTypeError } from "../errors/DecoratorUsageErrors";
import { DecoratorUtil, DecoratorType } from "../helpers/DecoratorUtils";
import { DecoratorHelper } from "./common/DecoratorHelper";
import { DecoratorMetadata } from "./common/DecoratorMetadata";
import * as _ from "lodash";

export class ComponentDecoratorMetadata extends DecoratorMetadata<ComponentDecoratorMetadata> {
    componentName: string;
    classToken: symbol;

    constructor(componentName: string) {
        super();
        this.componentName = componentName;
        this.classToken = Symbol('classToken');
    }

    mergeMetadata(decoratorMetadata: ComponentDecoratorMetadata) {

    }
}

export function Component() {
    return function (target) {
        DecoratorUtil.throwOnWrongType(Component, DecoratorType.CLASS, [...arguments]);

        DecoratorHelper.setMetadata(target, Component, new ComponentDecoratorMetadata(target.name));
    };
}
DecoratorHelper.createDecorator(Component, DecoratorType.CLASS);

export class ComponentUtil {

    static getComponentData(target): ComponentDecoratorMetadata {
        if (target) {
            if (DecoratorHelper.hasMetadata(target, Component)) {
                return <ComponentDecoratorMetadata> DecoratorHelper.getMetadata(target, Component);
            }
        }
    }

    static isComponent(target): boolean {
        if (_.isFunction(target)) {
            return !!this.getComponentData(target);
        }
    }

    static getClassToken(target): Symbol {
        return this.getComponentData(target).classToken;
    }

    static throwWhenNotOnComponentClass (decorator: Function, decoratorArgs: Array<any>, rootCause?: Error) {
        if (!this.isComponent(decoratorArgs[0])) {
            let subjectName = DecoratorUtil.getSubjectName(decoratorArgs);
            throw new DecoratorUsageTypeError(decorator, `@${Component.name} classes`, subjectName, rootCause);
        }
    }
}