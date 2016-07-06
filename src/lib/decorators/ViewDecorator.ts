import * as _ from "lodash";
import {RequestMappingUtil} from "../decorators/RequestMappingDecorator";
import {DecoratorException} from "../exceptions/DecoratorException";

export function View(name?:string) {
    return function (target, methodName) {
        let viewName = name;
        if(_.isUndefined(viewName)) {
            viewName = methodName;
        }
        let routerConfig = RequestMappingUtil.initRouterConfigIfDoesntExist(target);
        for (let route of routerConfig.routes) {
            if(route.methodHandler === methodName){
                route.view = viewName;
                return;
            }
        }
        throw new DecoratorException("View", `No route set for ${methodName} (@View has to be above @RequestMapping)`);
    }
}
