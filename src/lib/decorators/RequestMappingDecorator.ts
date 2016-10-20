import * as _ from "lodash";
import { DecoratorUtil, DecoratorType } from "../helpers/DecoratorUtils";
import { DecoratorUsageTypeError } from "../errors/DecoratorUsageErrors";
import { BadArgumentError } from "../errors/BadArgumentErrors";
import {StandaloneDecoratorMetadata} from "./common/DecoratorMetadata";
import {DecoratorHelper} from "./common/DecoratorHelper";

// NOTE: These are methods defined on the Express Router
// http://expressjs.com/en/4x/api.html#router
export class RequestMethod {
    static GET = 'get';
    static POST = 'post';
    static PUT = 'put';
    static DELETE = 'delete';
    static OPTIONS = 'options';
    static PATCH = 'patch';
}

export interface RequestMappingConfig {
    path: string;
    method?: string;
}

const ROUTER_CONFIG = Symbol('router_config');
const CLASS_ROUTER_CONFIG = Symbol('class_router_config');

export class RouterConfigItem {
    requestConfig: RequestMappingConfig;
    methodHandler: string;

    constructor(requestConfig: RequestMappingConfig, handler: string) {
        this.requestConfig = requestConfig;
        this.methodHandler = handler;
    }

    isValid() {
        return this.requestConfig && this.methodHandler;
    }
}

export class RouterConfig {
    routes: Array<RouterConfigItem> = [];
}

export class RequestMappingDecoratorMetadata extends StandaloneDecoratorMetadata<RequestMappingDecoratorMetadata> {
    routes: Array<RouterConfigItem>;
    path: string;

    constructor() {
        super();
        this.path = "";
        this.routes = [];
    }
}

export function RequestMapping(config: RequestMappingConfig) {
    return function (...args) {
        let type = DecoratorUtil.getType(args);

        let target = args[0];
        if (type === DecoratorType.METHOD) {
            if (config.method === undefined) {
                throw new BadArgumentError
                        (`When using @${RequestMapping.name} on methods you must provide the request method type`);
            }
            let method = args[1];
            let routerConfig = DecoratorHelper.getOwnMetadata(target, RequestMapping,
                new RequestMappingDecoratorMetadata());
            // TODO: Override bug #51
            routerConfig.routes.push(new RouterConfigItem(config, method));
            DecoratorHelper.setMetadata(target, RequestMapping, routerConfig);
        } else if (type === DecoratorType.CLASS) {
            // TODO: refactor when new options are added on @RequestMapping for classes
            let decoratorMetadata: RequestMappingDecoratorMetadata =
                DecoratorHelper.getOwnMetadata(target, RequestMapping, new RequestMappingDecoratorMetadata());
            decoratorMetadata.path = config.path;
            DecoratorHelper.setMetadata(target, RequestMapping, decoratorMetadata);
        } else {
            let subjectName = DecoratorUtil.getSubjectName(args);
            throw new DecoratorUsageTypeError(RequestMapping, "classes and methods", subjectName);
        }
    };
}
DecoratorHelper.createDecorator(RequestMapping, DecoratorType.CLASS, DecoratorType.METHOD);

export class RequestMappingUtil {

    static getValidRoutes(target): Array<RouterConfigItem> {
        let routerConfig = DecoratorHelper.getMetadataOrDefault(target, RequestMapping,
            new RequestMappingDecoratorMetadata(), DecoratorType.METHOD);
        return _.filter(routerConfig.routes, (route) => route.isValid());
    }
}