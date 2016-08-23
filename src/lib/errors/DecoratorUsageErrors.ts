import {BaseError} from "./BaseError";

export class DecoratorUsageError extends BaseError {}

export class DecoratorUsageTypeError extends DecoratorUsageError {
    constructor(decorator: Function, subjectType: string, subjectName: string, rootCause?: Error) {
        super(`@${decorator.name} can be used only on ${subjectType}. Instead it is used on ${subjectName}`,
            rootCause);
    }
}