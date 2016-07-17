import * as _ from "lodash";

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
    method: string;
}

export const ROUTER_CONFIG = Symbol('router_config');

export class RouterConfigItem {
    requestConfig: RequestMappingConfig;
    methodHandler: string;
    view: string;

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

export function RequestMapping(config: RequestMappingConfig) {
    return function (target, method) {
        let routerConfig = RequestMappingUtil.initRouterConfigIfDoesntExist(target);
        let routeConfig = _.find(routerConfig.routes, { methodHandler: method });
        if (routeConfig) {
            routeConfig.requestConfig = config;
        } else {
            routerConfig.routes.push(new RouterConfigItem(config, method));
        }
    }
}

export class RequestMappingUtil {

    static getValidRoutes(target): Array<RouterConfigItem> {
        let routerConfig = this.initRouterConfigIfDoesntExist(target.prototype);
        return _.filter(routerConfig.routes, (route) => route.isValid());
    }

    static initRouterConfigIfDoesntExist(target): RouterConfig {
        if(_.isUndefined(target[ROUTER_CONFIG])){
            target[ROUTER_CONFIG] = new RouterConfig();
        }
        return target[ROUTER_CONFIG];
    }
}