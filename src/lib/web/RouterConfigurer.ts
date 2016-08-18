import * as _ from "lodash";
import { Router } from "express-serve-static-core";
import { OrderUtil } from "../decorators/OrderDecorator";
import { RouterConfigItem } from "../decorators/RequestMappingDecorator";
import { RouteHandlerError, InterceptorError } from "../errors/WebErrors";

/**
 * RouteConfigurer responsible for configuring the Express 4.x router that will be exposed by the dispatcher.
 * */
export class RouterConfigurer {

    private router: Router;
    private interceptors: Array<any>;
    private routeHandlers: Map<RouterConfigItem, any>;

    constructor (router: Router) {
        this.router = router;
        this.interceptors = [];
        this.routeHandlers = new Map();
    }

    /**
     * Registers an interceptor.
     * @param instance instance of the interceptor
     * */
    registerInterceptor(instance) {
        this.interceptors.push(instance);
    }

    /**
     * Registers new route handler for the given route.
     * @param route the route configuration
     * @param handler the instance responsible for handling the route
     * */
    registerHandler(route: RouterConfigItem, handler) {
        this.routeHandlers.set(route, handler);
    }

    /**
     * Configures the Express router with the given interceptors and route handlers.
     * Note: this method needs to be called after all interceptors and route handlers have been registered.
     * */
    configure() {
        this.interceptors = OrderUtil.orderList(this.interceptors);
        this.configureMiddlewares();
    }

    private configureMiddlewares() {
        this.router.use(this.wrap(this.preHandler.bind(this)));
        // NOTE: we will have our middleware handler when we drop the dependency to express
        // That would require the dispatching by path to be implemented on our side
        this.registerRouteHandlers();
        this.router.use(this.wrap(this.postHandler.bind(this)));
        this.router.use(this.wrap(this.resolver.bind(this)));
    }

    private registerRouteHandlers() {
        for (let [route, handler] of this.routeHandlers.entries()) {
            let httpMethod = route.requestConfig.method;
            let path = route.requestConfig.path;
            console.log(`Registering route. Path: '${path}', method: ${httpMethod}.`);

            this.router[httpMethod](path, this.wrap(async(request, response, next) => {
                let result;
                try {
                    result = await handler[route.methodHandler](request, response);
                } catch (err) {
                    throw new RouteHandlerError(`${handler.constructor.name}.${route.
                        methodHandler} failed on ${httpMethod.toUpperCase()} ${path}`, err);
                }
                // TODO #3 saskodh: Check whether is more convenient to store in the request zone or pass on next
                response.$$frameworkData = {
                    view: route.view,
                    model: result
                };
                next();
            }));
        }
    }

    private async preHandler(request, response, next) {
        response.on('finish', async () => {
            for (let i = this.interceptors.length - 1; i >= 0; i -= 1) {
                let interceptor = this.interceptors[i];
                if (_.isFunction(interceptor.afterCompletion)) {
                    try {
                        await interceptor.afterCompletion(request, response);
                    } catch (err) {
                        // TODO: this doesnt throw because it is async and on an event listener (response on finish)
                        throw new InterceptorError(`${interceptor.constructor.
                            name}.afterCompletion failed on ${request.method} ${request.url}`, err);
                    }
                }
            }
        });

        for (let i = 0; i < this.interceptors.length; i += 1) {
            let interceptor = this.interceptors[i];
            if (_.isFunction(interceptor.preHandle)) {
                // NOTE: when the the preHandle function returns nothing the middleware chain is not broken
                try {
                    if (await interceptor.preHandle(request, response) === false) {
                        return;
                    }
                } catch (err) {
                    throw new InterceptorError(`${interceptor.constructor.name}.preHandle failed on ${request.
                        method} ${request.url}`, err);
                }
            }
        }
        next();
    }

    private async postHandler(request, response, next) {
        // NOTE: postHandle is executed in the reversed order
        for (let i = this.interceptors.length - 1; i >= 0; i -= 1) {
            let interceptor = this.interceptors[i];
            if (_.isFunction(interceptor.postHandle)) {
                try {
                    await interceptor.postHandle(request, response);
                } catch (err) {
                    throw new InterceptorError(`${interceptor.constructor.name}.postHandle failed on ${request.
                        method} ${request.url}`, err);
                }
            }
        }
        next();
    }

    private async resolver(request, response) {
        let handlingResult = response.$$frameworkData;
        if (handlingResult && response.finished === false) {
            if (_.isUndefined(handlingResult.view)) {
                response.json(handlingResult.model);
            } else {
                response.render(handlingResult.view, handlingResult.model);
            }
        }
    }

    // TODO saskodh: replace this workaround when we upgrade express to 5.x
    // NOTE: workaround because express 4.x does not support middle-wares returning promise
    private wrap(fn) {
        return (...args) => fn(...args).catch(args[2]);
    };
}