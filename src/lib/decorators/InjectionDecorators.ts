import { ComponentUtil } from "./ComponentDecorator";
import { TypeUtils } from "../helpers/TypeUtils";

const INJECT_DECORATOR_TOKEN = Symbol('injector_decorator_token');

export class DependencyData {
    token: Symbol;
    isArray: boolean;

    constructor(token: Symbol, isArray: boolean) {
        this.token = token;
        this.isArray = isArray;
    }
}
export class InjectionData {
    dependencies: Map<string, DependencyData>;
    dynamicDependencies: Map<string, DependencyData>;
    properties: Map<string, string>;

    constructor() {
        this.dependencies = new Map();
        this.dynamicDependencies = new Map();
        this.properties = new Map();
    }
}

export function Inject(dependencyToken?: Symbol) {
    return function (target: any, fieldName: string) {
        let type = Reflect.getMetadata('design:type', target, fieldName);
        let dependencyData = InjectUtil.createDependencyData(dependencyToken, type);
        InjectUtil.initIfDoesntExist(target).dependencies.set(fieldName, dependencyData);
    };
}

export function Autowire() {
    return Inject();
}

export function Value(preopertyKey) {
    return function (target: any, fieldName: string) {
        InjectUtil.initIfDoesntExist(target).properties.set(fieldName, preopertyKey);
    };
}

export function DynamicInject(dependencyToken?: Symbol) {
    return function (target: any, fieldName: string) {
        let type = Reflect.getMetadata('design:type', target, fieldName);
        let dependencyData = InjectUtil.createDependencyData(dependencyToken, type);
        InjectUtil.initIfDoesntExist(target).dynamicDependencies.set(fieldName, dependencyData);
    };
}

export function ThreadLocal() {
    return function (target: any, fieldName: string) {
        let className = target.constructor.name;
        let token = Symbol(`thread-local:${className}#${fieldName}`);
        InjectUtil.initIfDoesntExist(target).dynamicDependencies.set(fieldName, new DependencyData(token, false));
    };
}

export class InjectUtil {

    static createDependencyData(token, type): DependencyData {
        if (!token) {
            // fallback to field type
            if (ComponentUtil.isComponent(type)) {
                token = ComponentUtil.getClassToken(type);
            } else {
                throw new Error('Cannot inject dependency which is not a @Component!');
            }
        }
        // NOTE assumption: if type not declared or any then type is Object and isArray is false
        return new DependencyData(token, TypeUtils.isA(type, Array));
    }

    static getDependencies(target): Map<string, DependencyData> {
        return this.initIfDoesntExist(target).dependencies;
    }

    static getProperties(target): Map<string, string> {
        return this.initIfDoesntExist(target).properties;
    }

    // todo find better name
    static initIfDoesntExist(target): InjectionData {
        if (!target[INJECT_DECORATOR_TOKEN]) {
            target[INJECT_DECORATOR_TOKEN] = new InjectionData();
        }
        return target[INJECT_DECORATOR_TOKEN];
    }
}