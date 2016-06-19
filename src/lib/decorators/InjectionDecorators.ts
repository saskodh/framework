import {ComponentUtil} from "./ComponentDecorator";

export const INJECT_DECORATOR_TOKEN = Symbol('injector_decorator_token');

export class InjectionData {
    dependencies: Map<string, Symbol>;
    properties: Map<string, string>;

    constructor() {
        this.dependencies = new Map();
        this.properties = new Map();
    }
}

export function Inject(dependency) {
    return function (target:any, fieldName: string) {
        if (!ComponentUtil.isComponent(dependency)) throw new Error('Cannot inject dependency which is not a @Component!');
        InjectUtil.initIfDoesntExist(target).dependencies.set(fieldName, ComponentUtil.getToken(dependency));
    }
}

export function Value(preopertyKey) {
    return function (target:any, fieldName: string) {
        InjectUtil.initIfDoesntExist(target).properties.set(fieldName, preopertyKey);
    }
}

export class InjectUtil {
    
    static getDependencies (target): Map<string, Symbol> {
        return this.initIfDoesntExist(target).dependencies;
    }
    static getProperties (target): Map<string, string> {
        return this.initIfDoesntExist(target).properties;
    }

    // todo find better name
    static initIfDoesntExist(target): InjectionData {
        if (!target[INJECT_DECORATOR_TOKEN]) target[INJECT_DECORATOR_TOKEN] = new InjectionData();
        return target[INJECT_DECORATOR_TOKEN];
    }
}