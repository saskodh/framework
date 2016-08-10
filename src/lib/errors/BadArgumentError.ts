export class BadArgumentError extends Error {
    constructor ( message ) {
        super();
        (<any> Error).captureStackTrace( this, this.constructor );
        this.name = 'BadArgumentError';
        this.message = message;
    }
}