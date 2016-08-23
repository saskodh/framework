import { Request, Response } from "express-serve-static-core";
import { RequestContext, REQUEST_TOKEN, RESPONSE_TOKEN } from "./RequestContext";
import { Injector } from "../../di/Injector";
import { InvalidUsageError } from "../../errors/InvalidUsageError";

/** The token under which the RequestContext is stored as a property on the Zone (zone.js). */
export const REQUEST_CONTEXT_TOKEN = 'request-context';

/**
 * Request context holder.
 * Extracts the RequestContext from the current Zone (zone.js)
 * */
export class RequestContextHolder {

    /**
     * Returns the current RequestContext.
     * @returns {RequestContext} the current request context
     */
    static get(): RequestContext {
        let currentRequestContext = (<any> Zone).current.get(REQUEST_CONTEXT_TOKEN);
        if (!currentRequestContext) {
            throw new InvalidUsageError('This method cannot be called outside request context.');
        }
        return currentRequestContext;
    }

    /**
     * Returns the injector from the current RequestContext
     * @returns {Injector} the injector from the current request context
     */
    static getInjector(): Injector {
        return this.get().getInjector();
    }

    /**
     * Returns the current Express Request from the current RequestContext.
     * @returns {Request} current Express request
     */
    static getRequest(): Request {
        return <Request> this.getInjector().getComponent(REQUEST_TOKEN);
    }

    /**
     * Returns the current Express Response from the current RequestContext.
     * @returns {Response} current Express response
     */
    static getResponse(): Response {
        return <Response> this.getInjector().getComponent(RESPONSE_TOKEN);
    }
}