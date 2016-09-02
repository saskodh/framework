import { ComponentUtil } from "./ComponentDecorator";
import { TypeUtils } from "../helpers/TypeUtils";
import { InjectionError } from "../errors/InjectionError";
import { DecoratorType, DecoratorUtil } from "../helpers/DecoratorUtils";
import "reflect-metadata";
import { DecoratorHelper } from "./common/DecoratorHelper";
import { DecoratorMetadata } from "./common/DecoratorMetadata";
import { Decorator } from "./common/DecoratorDefinition";

const INJECT_DECORATOR_TOKEN = Symbol('injector_decorator_token');

export class DependencyData {
    token: Symbol;
    isArray: boolean;

    constructor(token: Symbol, isArray: boolean) {
        this.token = token;
        this.isArray = isArray;
    }
}
export class InjectionDataDecoratorMetadata extends DecoratorMetadata<InjectionDataDecoratorMetadata> {
    dependencies: Map<string, DependencyData>;
    dynamicDependencies: Map<string, DependencyData>;
    properties: Map<string, string>;

    constructor() {
        super();
        this.dependencies = new Map();
        this.dynamicDependencies = new Map();
        this.properties = new Map();
    }

    mergeMetadata(injectionData: InjectionDataDecoratorMetadata) {
        injectionData.dependencies.forEach((value, key, map) => {
            this.dependencies.set(key, value);
        }, this);

        injectionData.dynamicDependencies.forEach((value, key, map) => {
            this.dynamicDependencies.set(key, value);
        }, this);

        injectionData.properties.forEach((value, key, map) => {
            this.properties.set(key, value);
        }, this);
    }
}

export function Inject(dependencyToken?: Symbol) {
    return function (target: any, fieldName: string) {
        DecoratorUtil.throwOnWrongType(Inject, DecoratorType.PROPERTY, [...arguments]);
        let type = Reflect.getMetadata('design:type', target, fieldName);
        let dependencyData = InjectUtil.createDependencyData(dependencyToken, type, [...arguments]);

        let injectionDataDecoratorMetadata = DecoratorHelper.getOwnMetadata(target, Inject, new InjectionDataDecoratorMetadata(), true);
        injectionDataDecoratorMetadata.dependencies.set(fieldName, dependencyData);
        DecoratorHelper.setMetadata(target, Inject, injectionDataDecoratorMetadata);
    };
}
DecoratorHelper.createDecorator(Inject, DecoratorType.PROPERTY);

export function Autowired() {
    return function (target: any, fieldName: string) {
        DecoratorUtil.throwOnWrongType(Autowired, DecoratorType.PROPERTY, [...arguments]);
        return Inject()(target, fieldName);
    };
}

export function Value(preopertyKey) {
    return function (target: any, fieldName: string) {
        DecoratorUtil.throwOnWrongType(Value, DecoratorType.PROPERTY, [...arguments]);

        let injectionData = DecoratorHelper.getOwnMetadata(target, Value, new InjectionDataDecoratorMetadata(), true);
        injectionData.properties.set(fieldName, preopertyKey);
        DecoratorHelper.setMetadata(target, Value, injectionData);
    };
}
DecoratorHelper.createDecorator(Value, DecoratorType.PROPERTY);

export function DynamicInject(dependencyToken?: Symbol) {
    return function (target: any, fieldName: string) {
        let type = Reflect.getMetadata('design:type', target, fieldName);
        let dependencyData = InjectUtil.createDependencyData(dependencyToken, type, [...arguments]);

        let injectionData = DecoratorHelper.getOwnMetadata(target, DynamicInject, new InjectionDataDecoratorMetadata(), true);
        injectionData.dynamicDependencies.set(fieldName, dependencyData);
        DecoratorHelper.setMetadata(target, DynamicInject, injectionData);
    };
}
DecoratorHelper.createDecorator(DynamicInject, DecoratorType.PROPERTY);

export function ThreadLocal() {
    return function (target: any, fieldName: string) {
        let className = target.constructor.name;
        let token = Symbol(`thread-local:${className}#${fieldName}`);

        let injectionData = DecoratorHelper.getOwnMetadata(target, ThreadLocal, new InjectionDataDecoratorMetadata(), true);
        injectionData.dynamicDependencies.set(fieldName, new DependencyData(token, false));
        DecoratorHelper.setMetadata(target, ThreadLocal, injectionData);
    };
}
DecoratorHelper.createDecorator(ThreadLocal, DecoratorType.PROPERTY);

export class InjectUtil {

    static createDependencyData(token, type, args: Array<any>): DependencyData {
        if (!token) {
            // fallback to field type
            // TODO: ^ should be lazy-loaded #50
            if (ComponentUtil.isComponent(type)) {
                token = ComponentUtil.getClassToken(type);
            } else {
                let subjectName = DecoratorUtil.getSubjectName(args);
                throw new InjectionError(`Cannot inject dependency which is not a @Component! (${subjectName})`);
            }
        }
        // NOTE assumption: if type not declared or any then type is Object and isArray is false
        return new DependencyData(token, TypeUtils.isA(type, Array));
    }

    static getDependencies(target): Map<string, DependencyData> {
        return DecoratorHelper.getMetadata(target, Inject, new InjectionDataDecoratorMetadata()).dependencies;
    }

    static getProperties(target): Map<string, string> {
        return DecoratorHelper.getMetadata(target, Inject, new InjectionDataDecoratorMetadata()).properties;
    }
}