import { ComponentUtil } from "./ComponentDecorator";
import { TypeUtils } from "../helpers/TypeUtils";

export const INJECT_DECORATOR_TOKEN = Symbol('injector_decorator_token');

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
    properties: Map<string, string>;

    constructor() {
        this.dependencies = new Map();
        this.properties = new Map();
    }
}

export function Inject(dependencyToken?: Symbol) {
    return function (target: any, fieldName: string) {
        let token = dependencyToken;
        let type = (<any> Reflect).getMetadata('design:type', target, fieldName);
        if (!token) {
            // fallback to field type
            if (ComponentUtil.isComponent(type)) {
                token = ComponentUtil.getClassToken(type);
            } else {
                throw new Error('Cannot inject dependency which is not a @Component!');
            }
        }
        // NOTE assumption: if type not declared or any then type is Object and isArray is false
        let dependencyData = new DependencyData(token, TypeUtils.isA(type, Array));
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

export class InjectUtil {

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