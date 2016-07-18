import {Router} from "express";
import * as _ from "lodash";
import {ComponentUtil} from "../decorators/ComponentDecorator";
import {Interceptor} from "../interceptors/InterceptorDecorator";
import {Request, Response} from "express-serve-static-core";
import {NextFunction} from "express-serve-static-core";
import {RequestMappingUtil} from "../decorators/RequestMappingDecorator";

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
            let controllerMappingPath = RequestMappingUtil.getControllerRequestMappingPath(clazz);
            let fullPath = controllerMappingPath+route.requestConfig.path;
            this.router[route.requestConfig.method](fullPath, (request, response) => {
                instance[route.methodHandler](request, response).then(function (result) {
                    if(_.isUndefined(route.view)){
                        response.json(result);
                    }
                    else {
                        response.render(route.view,result);
                    }
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