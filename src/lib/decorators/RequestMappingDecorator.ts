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

    constructor(requestConfig: RequestMappingConfig, handler: string) {
        this.requestConfig = requestConfig;
        this.methodHandler = handler;
    }
}

export class RouterConfig {
    routes: Array<RouterConfigItem> = [];
}

export function RequestMapping(config: RequestMappingConfig) {
    return function (target, method) {
        if (!target[ROUTER_CONFIG]) target[ROUTER_CONFIG] = new RouterConfig();
        target[ROUTER_CONFIG].routes.push(new RouterConfigItem(config, method));
    }
}

export class RequestMappingUtil {

    static getRouterConfig(target): RouterConfig {
        return target.prototype[ROUTER_CONFIG] || new RouterConfig();
    }
}