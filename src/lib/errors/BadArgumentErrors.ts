import { BaseError } from "./BaseError";
import { DecoratorUtil } from "../helpers/DecoratorUtils";
export class BadArgumentError extends BaseError {}

export class DecoratorBadArgumentError extends BadArgumentError {

    constructor(message: string, decorator: Function, decoratorArgs: Array<any>, rootCause?: Error) {
        let subjectName = DecoratorUtil.getSubjectName(decoratorArgs);
        super(`${message} (In @${decorator.name} on ${subjectName})`, rootCause);
    }
}