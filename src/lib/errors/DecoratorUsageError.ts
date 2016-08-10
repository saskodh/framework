export class DecoratorUsageError extends Error {
    constructor ( message ) {
        super();
        (<any> Error).captureStackTrace( this, this.constructor );
        this.name = 'DecoratorUsageError';
        this.message = message;
    }
}