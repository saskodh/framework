import { InjectUtil, InjectionData } from "./InjectionDecorators";
import { CONTROLLER_DECORATOR_TOKEN } from "./ControllerDecorator";
import { INTERCEPTOR_DECORATOR_TOKEN } from "../interceptors/InterceptorDecorator";
import { DecoratorUsageError } from "../errors/DecoratorUsageError";
import { DecoratorUtil, DecoratorType } from "../helpers/DecoratorUtils";

export class ComponentData {
    classToken: Symbol;
    aliasTokens: Array<Symbol>;
    injectionData: InjectionData;
    profile: string;

    constructor() {
        this.classToken = Symbol('classToken');
        this.aliasTokens = [];
        this.injectionData = new InjectionData();
    }
}

const COMPONENT_DECORATOR_TOKEN = Symbol('component_decorator_token');

export function Component() {
    return function (target) {
        let args = Array.prototype.slice.call(arguments);
        if (!DecoratorUtil.isType(DecoratorType.CLASS, args)) {
            let subjectName = DecoratorUtil.getSubjectName(args);
            throw new DecoratorUsageError(`@Component can be set only on a class! (${subjectName})`);
        }
        let componentData = new ComponentData();
        componentData.injectionData = InjectUtil.initIfDoesntExist(target.prototype);
        target[COMPONENT_DECORATOR_TOKEN] = componentData;
    };
}

export function Profile(profile: string) {
    return function (target) {
        if (!ComponentUtil.isComponent(target)) {
            let subjectName = DecoratorUtil.getSubjectName(Array.prototype.slice.call(arguments));
            throw new DecoratorUsageError(`@Profile can be set only on @Component! (${subjectName})`);
        }
        ComponentUtil.getComponentData(target).profile = profile;
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
}