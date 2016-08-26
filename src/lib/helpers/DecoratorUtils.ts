import { DecoratorUsageTypeError } from "../errors/DecoratorUsageErrors";
import { GeneralUtils } from "./GeneralUtils";
import "reflect-metadata";

export class DecoratorType {
    static CLASS = 'class';
    static METHOD = 'method';
    static PROPERTY = 'property';
    static PARAMETER = 'parameter';

    static getAllTypes (): Array<string> {
        return [this.CLASS, this.METHOD, this.PROPERTY, this.PARAMETER];
    }
}


export class DecoratorUtil {

    static getType(decoratorArgs: Array<any>): string {
        if (decoratorArgs.length === 1) {
            return DecoratorType.CLASS;
        } else if (decoratorArgs.length === 2) {
            // NOTE: assumption valid for ES6+, if target is ES5 then the method decorators will also have 2 arguments
            return DecoratorType.PROPERTY;
        } else if (decoratorArgs.length === 3) {
            if (typeof decoratorArgs[2] === 'number') {
                return DecoratorType.PARAMETER;
            } else if (typeof decoratorArgs[2] === "undefined") {
                return DecoratorType.PROPERTY;
            } else {
                return DecoratorType.METHOD;
            }
        }
    }

    static isType(decoratorType: DecoratorType, decoratorArgs: Array<any>): boolean {
        return this.getType(decoratorArgs) === decoratorType;
    }

    /**
     * Returns the name of the thing where the decorator is put. "ClassName" for classes,
     * "ClassName.propertyName" for properties, "ClassName.methodName(Environment, String)" for methods
     * and "0th param of ClassName.methodName(Environment, String)" for parameters
     * @param decoratorArgs: The arguments to the decorator function (decoratorArgs[0] is the target)
     * @returns string
     */
    static getSubjectName (decoratorArgs: Array<any>) {
        if (this.isType(DecoratorType.CLASS, decoratorArgs)) {
            return decoratorArgs[0].name;
        }
        if (this.isType(DecoratorType.PROPERTY, decoratorArgs)) {
            return [decoratorArgs[0].constructor.name, decoratorArgs[1]].join('.');
        }
        let parameterTypes = Reflect.getMetadata('design:paramtypes', decoratorArgs[0], decoratorArgs[1])
            .map((param) => param.name).join(", ");
        if (this.isType(DecoratorType.METHOD, decoratorArgs)) {
            return `${decoratorArgs[0].constructor.name}.${decoratorArgs[1]}(${parameterTypes})`;
        }
        return `${GeneralUtils.getOrdinalNumber(decoratorArgs[2])} param of ${decoratorArgs[0]
            .constructor.name}.${decoratorArgs[1]}(${parameterTypes})`;
    }

    static throwOnWrongType (decorator: Function, decoratorType: DecoratorType,
                             decoratorArgs: Array<any>, rootCause?: Error) {
        if (!this.isType(decoratorType, decoratorArgs)) {
            let subjectName = this.getSubjectName(decoratorArgs);
            if (decoratorType === DecoratorType.CLASS) {
                throw new DecoratorUsageTypeError(decorator, "classes", subjectName, rootCause);
            }
            if (decoratorType === DecoratorType.METHOD) {
                throw new DecoratorUsageTypeError(decorator, "methods", subjectName, rootCause);
            }
            if (decoratorType === DecoratorType.PROPERTY) {
                throw new DecoratorUsageTypeError(decorator, "properties", subjectName, rootCause);
            }
            if (decoratorType === DecoratorType.PARAMETER) {
                throw new DecoratorUsageTypeError(decorator, "parameters", subjectName, rootCause);
            }
        }
    }
}