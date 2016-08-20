import {Request, Response} from "express-serve-static-core";
import {Injector} from "../di/Injector";

export const REQUEST_TOKEN = Symbol('request');
export const RESPONSE_TOKEN = Symbol('response');

const REQUEST_CONTEXT_TOKEN = 'request-context';

export class RequestContext {

    private injector: Injector;
    private requestZone: Zone;

    constructor(request: Request, response: Response) {
        this.injector = new Injector();
        this.injector.register(REQUEST_TOKEN, request);
        this.injector.register(RESPONSE_TOKEN, response);
        this.requestZone = this.createRequestZone(this.injector);
    }

    run(requestHandler: Function) {
        this.requestZone.run(requestHandler);
    }

    static getInjector(): Injector {
        let injector = (<any> Zone).current.get(REQUEST_CONTEXT_TOKEN);
        if (!injector) {
            throw new Error('This method cannot be called outside request context.');
        }
        return <Injector> injector;
    }

    private createRequestZone(injector: Injector) {
        let requestZoneSpec = {
            name: REQUEST_CONTEXT_TOKEN,
            properties: {}
        };
        requestZoneSpec.properties[REQUEST_CONTEXT_TOKEN] = injector;
        return (<any> Zone).current.fork(requestZoneSpec).fork(Zone['longStackTraceZoneSpec']);
    }
}