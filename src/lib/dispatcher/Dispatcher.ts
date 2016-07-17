import {Router} from "express";
import * as _ from "lodash";
import {ComponentUtil} from "../decorators/ComponentDecorator";
import {Interceptor} from "../interceptors/InterceptorDecorator";
import {Request, Response} from "express-serve-static-core";
import {NextFunction} from "express-serve-static-core";
import {RequestMappingUtil} from "../decorators/RequestMappingDecorator";
import {RequestContext} from "../di/RequestContext";

export class Dispatcher {

    private router: Router;

    constructor() {
        this.router = Router();
    }

    getRouter () {
        return this.router;
    }

    processAfterInit(clazz, instance) {
        if (ComponentUtil.isInterceptor(clazz)) {
            this.registerInterceptor(instance);
        }
        if (ComponentUtil.isController(clazz)) {
            this.registerController(clazz, instance);
        }
    }

    private registerController (clazz, instance) {
        for (let route of RequestMappingUtil.getValidRoutes(clazz)) {
            //console.log('Registering route: ', route);
            this.router[route.requestConfig.method](route.requestConfig.path, (request, response) => {
                let requestContext = new RequestContext(request, response);
                requestContext.run(() => {
                    instance[route.methodHandler](request, response).then(function (result) {
                        if (_.isUndefined(route.view)){
                            response.json(result);
                        } else {
                            response.render(route.view, result);
                        }
                    }, function (error) {
                        response.status(500).json({
                            error: error,
                            stacktrace: error.stack
                        });
                    });
                });
            });
        }
    }

    private registerInterceptor(interceptor: Interceptor) {
        this.router.use((request:Request, response: Response, next: NextFunction) => {
            interceptor.preHandle(request, response)
                .then(next).catch((error) => console.log(error));
        });
    }
}