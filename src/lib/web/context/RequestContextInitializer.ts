import { RequestHandler } from "express-serve-static-core";
import { RequestContext } from "./RequestContext";
import { REQUEST_CONTEXT_TOKEN } from "./RequestContextHolder";

/**
 * Request context initializer.
 * Defines the Express middleware responsible for initializing the RequestContext for each incoming request.
 */
export class RequestContextInitializer {

    /**
     * Returns the Express middleware responsible for initializing the RequestContext for each incoming request.
     * Creates new Zone (zone.js) for each incoming request in which the continuing request handling will be done.
     * The RequestContext is stored as property in the newly created Zone.
     * @returns {RequestHandler}
     */
    static getMiddleware(): RequestHandler {
        return function (request, response, next) {
            let requestContext = new RequestContext(request, response);
            RequestContextInitializer.createRequestZone(requestContext).run(next);
        };
    }

    private static createRequestZone(requestContext: RequestContext) {
        let requestZoneSpec = {
            name: REQUEST_CONTEXT_TOKEN,
            properties: {}
        };
        requestZoneSpec.properties[REQUEST_CONTEXT_TOKEN] = requestContext;
        return (<any> Zone).current.fork(requestZoneSpec).fork(Zone['longStackTraceZoneSpec']);
    }
}