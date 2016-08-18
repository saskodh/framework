import {BaseError} from "./BaseError";

export class DecoratorUsageError extends BaseError {}

export class DecoratorUsageTypeError extends DecoratorUsageError {
    constructor(decoratorName: string, subjectType: string, subjectName: string, rootCause?: Error) {
        super(`${decoratorName} can be used only on ${subjectType}. Instead it is used on ${subjectName}`,
            rootCause);
    }
}