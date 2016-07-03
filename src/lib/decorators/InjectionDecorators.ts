import {ComponentUtil} from "./ComponentDecorator";

export const INJECT_DECORATOR_TOKEN = Symbol('injector_decorator_token');

export class InjectionData {
    dependencies: Map<string, Symbol>;
    dynamicDependencies: Map<string, Symbol>;
    properties: Map<string, string>;

    constructor() {
        this.dependencies = new Map();
        this.dynamicDependencies = new Map();
        this.properties = new Map();
    }
}

export function Inject(dependencyToken?: Symbol) {
    return function (target:any, fieldName: string) {
        let token = dependencyToken;
        if (!token) {
            // fallback to field type
            let type = Reflect.getMetadata('design:type', target, fieldName);
            if (ComponentUtil.isComponent(type)) {
                token = ComponentUtil.getToken(type);
            } else {
               throw new Error('Cannot inject dependency which is not a @Component!')
            }
        }
        InjectUtil.initIfDoesntExist(target).dependencies.set(fieldName, token);
    }
}

export function Autowire() {
    return Inject();
}

export function Value(preopertyKey) {
    return function (target:any, fieldName: string) {
        InjectUtil.initIfDoesntExist(target).properties.set(fieldName, preopertyKey);
    }
}

export function ThreadLocal() {
    return function (target: any, fieldName: string) {
        let className = target.constructor.name;
        let token = Symbol(`thread-local:${className}#${fieldName}`);
        InjectUtil.initIfDoesntExist(target).dynamicDependencies.set(fieldName, token);
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