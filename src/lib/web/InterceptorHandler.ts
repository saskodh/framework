import * as _ from "lodash";
import { Router } from "express-serve-static-core";
import { ComponentUtil } from "../decorators/ComponentDecorator";
import { OrderUtil } from "../decorators/OrderDecorator";

export class InterceptorHandler {
    private interceptors: Array<any>;

    constructor () {
        this.interceptors = [];
    }

    registerPreHandleMiddleware(router: Router) {
        router.use(this.preHandler.bind(this));
    }

    registerPostHandleMiddleware(router: Router) {
        router.use(this.postHandler.bind(this));
    }

    registerInterceptor(clazz, instance) {
        // TODO: should this throw error when not interceptor?
        // so far it is only used on dispatcher.processAfterInit, which checks for isInterceptor
        if (ComponentUtil.isInterceptor(clazz)) {
            this.interceptors.push(instance);
        }
    }

    sort () {
        this.interceptors = OrderUtil.orderList(this.interceptors);
    }

    private preHandler (req, res, next) {
        for (let interceptor of this.interceptors){
            if (_.isFunction(interceptor.preHandle)) {
                interceptor.preHandle(req, res);
            }
        }
        next();
    }

    private postHandler (req, res, next) {
        for (let interceptor of this.interceptors.reverse()){
            if (_.isFunction(interceptor.postHandle)) {
                interceptor.postHandle(req, res);
            }
        }
        next();
    }
}