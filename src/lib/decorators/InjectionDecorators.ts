import { ComponentUtil } from "./ComponentDecorator";
import { TypeUtils } from "../helpers/TypeUtils";
import { InjectionError } from "../errors/InjectionError";
import { DecoratorType, DecoratorUtil } from "../helpers/DecoratorUtils";

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
    properties: Map<string, string>;

    constructor() {
        this.dependencies = new Map();
        this.properties = new Map();
    }
}

export function Inject(dependencyToken?: Symbol) {
    return function (...args) {
        DecoratorUtil.throwOnWrongType("@Inject", DecoratorType.PROPERTY, Array.prototype.slice.call(arguments));
        let target = args[0];
        let fieldName = args[1];
        let token = dependencyToken;
        let type = (<any> Reflect).getMetadata('design:type', target, fieldName);
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
        let dependencyData = new DependencyData(token, TypeUtils.isA(type, Array));
        InjectUtil.initIfDoesntExist(target).dependencies.set(fieldName, dependencyData);
    };
}

export function Autowired() {
    return function (...args) {
        DecoratorUtil.throwOnWrongType("@Autowired", DecoratorType.PROPERTY, args);
        return Inject()(...args);
    };
}

export function Value(preopertyKey) {
    return function (target: any, fieldName: string) {
        DecoratorUtil.throwOnWrongType("@Value", DecoratorType.PROPERTY, Array.prototype.slice.call(arguments));
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