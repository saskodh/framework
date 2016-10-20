import { Router } from "express";
import { ComponentUtil } from "../decorators/ComponentDecorator";
import { RouterConfigurer } from "./RouterConfigurer";
import {
    RequestMappingUtil, RequestMappingDecoratorMetadata,
    RequestMapping
} from "../decorators/RequestMappingDecorator";
import { LoggerFactory } from "../helpers/logging/LoggerFactory";
import {DecoratorHelper} from "../decorators/common/DecoratorHelper";
import {Interceptor} from "../decorators/InterceptorDecorator";
import {Controller} from "../decorators/ControllerDecorator";
import {DecoratorType} from "../helpers/DecoratorUtils";

let logger = LoggerFactory.getInstance();

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
        if (DecoratorHelper.hasMetadata(clazz, Interceptor)) {
            this.routerConfigurer.registerInterceptor(instance);
        }
        if (DecoratorHelper.hasMetadata(clazz, Controller)) {
            this.registerController(clazz, instance);
        }
    }

    // TODO #29 saskodh: initialize the dispatcher with a post processor
    postConstruct() {
        this.routerConfigurer.configure();
    }

    private registerController(clazz, instance) {
        logger.debug(`Registering controller ${ComponentUtil.getComponentData(clazz).componentName}.`);
        let controllerMappingPath = DecoratorHelper.getMetadataOrDefault(clazz, RequestMapping,
            new RequestMappingDecoratorMetadata(), DecoratorType.CLASS).path;
        for (let route of RequestMappingUtil.getValidRoutes(clazz)) {
            route.requestConfig.path = controllerMappingPath + route.requestConfig.path;

            this.routerConfigurer.registerHandler(route, instance);
        }
    }
}