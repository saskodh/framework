import {InjectUtil, InjectionData} from "./InjectionDecorators";
import {CONTROLLER_DECORATOR_TOKEN} from "./ControllerDecorator";
import {INTERCEPTOR_DECORATOR_TOKEN} from "../interceptors/InterceptorDecorator";

export class ComponentData {
    token: Symbol;
    injectionData: InjectionData;
    profile: string;

    constructor (token?: Symbol) {
        this.token = token || Symbol('di_token');
        this.injectionData = new InjectionData();
    }
}

export const COMPONENT_DECORATOR_TOKEN = Symbol('component_decorator_token');

export function Component (token?: Symbol) {
    return function (target) {
        var componentData = new ComponentData(token);
        componentData.injectionData = InjectUtil.initIfDoesntExist(target.prototype);
        target[COMPONENT_DECORATOR_TOKEN] = componentData;
    }
}

export function Profile (profile: string) {
    return function (target) {
        if (!ComponentUtil.isComponent(target)) throw '@Profile can be set only on @Component!';
        ComponentUtil.getComponentData(target).profile = profile;
    }
}

export class ComponentUtil {

    static getComponentData (target): ComponentData {
        return target[COMPONENT_DECORATOR_TOKEN];
    }

    static isComponent (target): boolean {
        return !!this.getComponentData(target);
    }

    static getToken (target): Symbol {
        return this.getComponentData(target).token;
    }

    static getInjectionData (target): InjectionData {
        return this.getComponentData(target).injectionData;
    }

    static isController (target): boolean {
        return !!target[CONTROLLER_DECORATOR_TOKEN];
    }

    static isInterceptor (target): boolean {
        return !!target[INTERCEPTOR_DECORATOR_TOKEN];
    }
}