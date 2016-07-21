import * as _ from "lodash";
import { RequestMappingUtil, RouterConfigItem } from "../decorators/RequestMappingDecorator";

export function View(name?: string) {
    return function (target, methodName) {
        let viewName = name || methodName;
        let routerConfig = RequestMappingUtil.initRouterConfigIfDoesntExist(target);
        let routeConfig = _.find(routerConfig.routes, {methodHandler: methodName});
        if (!routeConfig) {
            // NOTE: in case when @View is before @RequestMapping
            routeConfig = new RouterConfigItem(null, methodName);
            routerConfig.routes.push(routeConfig);
        }
        routeConfig.view = viewName;
    };
}
