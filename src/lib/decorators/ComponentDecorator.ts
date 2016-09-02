import { InjectionDataDecoratorMetadata } from "./InjectionDecorators";
import { Interceptor } from "./InterceptorDecorator";
import {
    ComponentDefinitionPostProcessor
} from "../processors/ComponentDefinitionPostProcessor";
import { ComponentPostProcessor } from "../processors/ComponentPostProcessor";
import { Aspect } from "./aspect/AspectDecorator";
import { DecoratorUsageTypeError } from "../errors/DecoratorUsageErrors";
import { DecoratorUtil, DecoratorType } from "../helpers/DecoratorUtils";
import { DecoratorHelper } from "./common/DecoratorHelper";
import { Controller } from "./ControllerDecorator";
import { DecoratorMetadata } from "./common/DecoratorMetadata";

export class ComponentDecoratorMetadata extends DecoratorMetadata<ComponentDecoratorMetadata> {
    componentName: string;
    classToken: symbol;
    aliasTokens: Array<symbol>;
    injectionData: InjectionDataDecoratorMetadata;
    profiles: Array<string>;

    constructor(componentName: string) {
        super();
        this.componentName = componentName;
        this.classToken = Symbol('classToken');
        this.aliasTokens = [];
        this.injectionData = new InjectionDataDecoratorMetadata();
        this.profiles = [];
    }

    mergeMetadata(decoratorMetadata: ComponentDecoratorMetadata) {
        this.aliasTokens = this.aliasTokens.concat(decoratorMetadata.aliasTokens);
        this.aliasTokens.push(decoratorMetadata.classToken);
        this.injectionData.mergeMetadata(decoratorMetadata.injectionData);
    }
}

export function Component() {
    return function (target) {
        DecoratorUtil.throwOnWrongType(Component, DecoratorType.CLASS, [...arguments]);

        let componentDecoratorMetadata = new ComponentDecoratorMetadata(target.name);
        DecoratorHelper.setMetadata(target, Component, componentDecoratorMetadata);
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
        return !!this.getComponentData(target);
    }

    static getClassToken(target): Symbol {
        return this.getComponentData(target).classToken;
    }

    static getAliasTokens(target): Array<Symbol> {
        return this.getComponentData(target).aliasTokens;
    }

    static getInjectionData(target): InjectionDataDecoratorMetadata {
        return this.getComponentData(target).injectionData;
    }

    static isController(target): boolean {
        return DecoratorHelper.hasMetadata(target, Controller);
    }

    static isInterceptor(target): boolean {
        return DecoratorHelper.hasMetadata(target, Interceptor);
    }

    static isComponentDefinitionPostProcessor(target): boolean {
        return DecoratorHelper.hasMetadata(target, ComponentDefinitionPostProcessor);
    }

    static isComponentPostProcessor(target): boolean {
        return DecoratorHelper.hasMetadata(target, ComponentPostProcessor);
    }

    static isAspect(target): boolean {
        return DecoratorHelper.hasMetadata(target, Aspect);
    }

    static throwWhenNotOnComponentClass (decorator: Function, decoratorArgs: Array<any>, rootCause?: Error) {
        if (!this.isComponent(decoratorArgs[0])) {
            let subjectName = DecoratorUtil.getSubjectName(decoratorArgs);
            throw new DecoratorUsageTypeError(decorator, `@${Component.name} classes`, subjectName, rootCause);
        }
    }
}