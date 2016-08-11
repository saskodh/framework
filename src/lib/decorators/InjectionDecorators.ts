import { ComponentUtil } from "./ComponentDecorator";
import { TypeUtils } from "../helpers/TypeUtils";
import { InjectionError } from "../errors/InjectionError";
import { DecoratorUsageError } from "../errors/DecoratorUsageError";
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
        if (!DecoratorUtil.isType(DecoratorType.PROPERTY, args)) {
            let subject = DecoratorUtil.getSubjectName(args);
            throw new DecoratorUsageError(`@Inject can be set only on properties of a @Component class! (${subject})`);
        }
        let target = args[0];
        let fieldName = args[1];
        let token = dependencyToken;
        let type = (<any> Reflect).getMetadata('design:type', target, fieldName);
        if (!token) {
            // fallback to field type
            if (ComponentUtil.isComponent(type)) {
                token = ComponentUtil.getClassToken(type);
            } else {
                let sub = DecoratorUtil.getSubjectName(args);
                throw new InjectionError(`Cannot inject dependency (${type.name}) which is not a @Component! (${sub})`);
            }
        }
        // NOTE assumption: if type not declared or any then type is Object and isArray is false
        let dependencyData = new DependencyData(token, TypeUtils.isA(type, Array));
        InjectUtil.initIfDoesntExist(target).dependencies.set(fieldName, dependencyData);
    };
}

export function Autowired() {
    return function (...args) {
        if (!DecoratorUtil.isType(DecoratorType.PROPERTY, args)) {
            let subj = DecoratorUtil.getSubjectName(args);
            throw new DecoratorUsageError(`@Autowired can be set only on properties of a @Component class! (${subj})`);
        }
        return Inject()(...args);
    };
}

export function Value(preopertyKey) {
    return function (target: any, fieldName: string) {
        let args = Array.prototype.slice.call(arguments);
        if (!DecoratorUtil.isType(DecoratorType.PROPERTY, args)) {
            let subject = DecoratorUtil.getSubjectName(args);
            throw new DecoratorUsageError(`@Value can be set only on properties of a @Component class! (${subject})`);
        }
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