import { Router } from "express";
import { ComponentUtil } from "../decorators/ComponentDecorator";
import { RouterConfigurer } from "./RouterConfigurer";
import { RequestMappingUtil } from "../decorators/RequestMappingDecorator";

export class Dispatcher {

    private router: Router;
    private routerConfigurer: RouterConfigurer;

    constructor() {
        this.router = Router();
        this.routerConfigurer = new RouterConfigurer(this.router);
    }

    getRouter() {
        return this.router;
    }

    processAfterInit(clazz, instance) {
        if (ComponentUtil.isInterceptor(clazz)) {
            this.routerConfigurer.registerInterceptor(instance);
        }
        if (ComponentUtil.isController(clazz)) {
            this.registerController(clazz, instance);
        }
    }

    // TODO #29 saskodh: initialize the dispatcher with a post processor
    postConstruct() {
        this.routerConfigurer.configure();
    }

    private registerController(clazz, instance) {
        let controllerMappingPath = RequestMappingUtil.getControllerRequestMappingPath(clazz);
        for (let route of RequestMappingUtil.getValidRoutes(clazz)) {
            route.requestConfig.path = controllerMappingPath + route.requestConfig.path;
            this.routerConfigurer.registerHandler(route, instance);
        }
    }
}