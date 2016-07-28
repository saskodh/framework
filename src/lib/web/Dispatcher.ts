import { Router } from "express";
import * as _ from "lodash";
import { ComponentUtil } from "../decorators/ComponentDecorator";
import { InterceptorHandler } from "./InterceptorHandler";
import { RequestMappingUtil } from "../decorators/RequestMappingDecorator";

export class Dispatcher {

    private router: Router;
    private interceptorHandler: InterceptorHandler;

    constructor() {
        this.router = Router();
        this.interceptorHandler = new InterceptorHandler();
        this.interceptorHandler.registerPreHandleMiddleware(this.router);
    }

    getRouter() {
        return this.router;
    }

    processAfterInit(clazz, instance) {
        if (ComponentUtil.isInterceptor(clazz)) {
            this.interceptorHandler.registerInterceptor(clazz, instance);
        }
        if (ComponentUtil.isController(clazz)) {
            this.registerController(clazz, instance);
        }
    }

    postConstruct() {
        this.interceptorHandler.sort();
        this.interceptorHandler.registerPostHandleMiddleware(this.router);
        this.router.use(this.resolveResponse);
    }

    private registerController(clazz, instance) {
        for (let route of RequestMappingUtil.getValidRoutes(clazz)) {
            // console.log('Registering route: ', route);
            let controllerMappingPath = RequestMappingUtil.getControllerRequestMappingPath(clazz);
            let fullPath = controllerMappingPath + route.requestConfig.path;
            this.router[route.requestConfig.method](fullPath, (request, response, next) => {
                instance[route.methodHandler](request, response).then(function (result) {
                    if (!_.isUndefined(route.view)) {
                        response.view = route.view;
                    }
                    response.result = result;
                    next();
                });
            });
        }
    }

    private resolveResponse(req, res, next) {
        if (_.isUndefined(res.view)) {
            res.json(res.result);
        } else {
            res.render(res.view, res.result);
        }
        next();
    }
}