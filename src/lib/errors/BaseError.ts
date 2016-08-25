import * as _ from "lodash";
export class BaseError extends Error {

    rootCause: Error;

    constructor (message: string, rootCause?: Error) {
        super(message);
        this.name = this.constructor.name;
        this.rootCause = rootCause;
        (<any> Error).captureStackTrace(this, this.constructor);
        this.message = message;
        if (!_.isUndefined(rootCause)) {
            this.stack = `${this.stack}\nRoot cause: ${rootCause.stack}\n`;
        }
    }
}