import { InjectUtil, InjectionData } from "./InjectionDecorators";
import { CONTROLLER_DECORATOR_TOKEN } from "./ControllerDecorator";
import { INTERCEPTOR_DECORATOR_TOKEN } from "./InterceptorDecorator";
import { COMPONENT_DEFINITION_POST_PROCESSOR_DECORATOR_TOKEN } from "../processors/ComponentDefinitionPostProcessor";
import { COMPONENT_POST_PROCESSOR_DECORATOR_TOKEN } from "../processors/ComponentPostProcessor";
import { DecoratorUsageError, DecoratorUsageTypeError } from "../errors/DecoratorUsageErrors";
import { DecoratorUtil, DecoratorType } from "../helpers/DecoratorUtils";

export class ComponentData {
    classToken: Symbol;
    aliasTokens: Array<Symbol>;
    injectionData: InjectionData;
    profiles: Array<string>;

    constructor() {
        this.classToken = Symbol('classToken');
        this.aliasTokens = [];
        this.profiles = [];
        this.injectionData = new InjectionData();
    }
}

const COMPONENT_DECORATOR_TOKEN = Symbol('component_decorator_token');

export function Component() {
    return function (target) {
        let args = Array.prototype.slice.call(arguments);
        DecoratorUtil.throwOnWrongType("@Component", DecoratorType.CLASS, args);
        if (target[COMPONENT_DECORATOR_TOKEN]
            && target[COMPONENT_DECORATOR_TOKEN] !== target.__proto__[COMPONENT_DECORATOR_TOKEN]) {
            let subjectName = DecoratorUtil.getSubjectName(args);
            throw new DecoratorUsageError(`Duplicate @Component decorator' (${subjectName})`);
        }
        let componentData = new ComponentData();
        componentData.injectionData = InjectUtil.initIfDoesntExist(target.prototype);
        target[COMPONENT_DECORATOR_TOKEN] = componentData;
    };
}

export class ComponentUtil {

    static getComponentData(target): ComponentData {
        if (target) {
            return target[COMPONENT_DECORATOR_TOKEN];
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

    static getInjectionData(target): InjectionData {
        return this.getComponentData(target).injectionData;
    }

    static isController(target): boolean {
        return !!target[CONTROLLER_DECORATOR_TOKEN];
    }

    static isInterceptor(target): boolean {
        return !!target[INTERCEPTOR_DECORATOR_TOKEN];
    }

    static isComponentDefinitionPostProcessor(target): boolean {
    return !!target[COMPONENT_DEFINITION_POST_PROCESSOR_DECORATOR_TOKEN];
}

    static isComponentPostProcessor(target): boolean {
        return !!target[COMPONENT_POST_PROCESSOR_DECORATOR_TOKEN];
    }

    static throwWhenNotOnComponentClass (decoratorName: string, args: Array<any>, rootCause?: Error) {
        if (!this.isComponent(args[0])) {
            let subjectName = DecoratorUtil.getSubjectName(args);
            throw new DecoratorUsageTypeError(decoratorName, "@Component classes", subjectName, rootCause);
        }
    }
}