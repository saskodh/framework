import { Request, Response } from "express-serve-static-core";
import { Injector } from "../../di/Injector";

/** Token under which the current Express request is stored in the RequestContext's injector. */
export const REQUEST_TOKEN = Symbol('request');

/** Token under which the current Express response is stored in the RequestContext's injector. */
export const RESPONSE_TOKEN = Symbol('response');

/**
 * Request context model.
 */
export class RequestContext {

    private injector: Injector;

    constructor(request: Request, response: Response) {
        this.injector = new Injector();
        this.injector.register(REQUEST_TOKEN, request);
        this.injector.register(RESPONSE_TOKEN, response);
    }

    getInjector(): Injector {
        return this.injector;
    }
}