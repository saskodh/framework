export class InjectionError extends Error {
    constructor ( message ) {
        super();
        (<any> Error).captureStackTrace( this, this.constructor );
        this.name = 'InjectionError';
        this.message = message;
    }
}