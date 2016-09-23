import * as _ from "lodash";
import {
    RequestMappingUtil, RouterConfigItem, RequestMapping,
    RequestMappingDecoratorMetadata
} from "../decorators/RequestMappingDecorator";
import { DecoratorUtil, DecoratorType } from "../helpers/DecoratorUtils";
import {DecoratorHelper} from "./common/DecoratorHelper";

export function View(name?: string) {
    return function (target, methodName) {
        DecoratorUtil.throwOnWrongType(View, DecoratorType.METHOD, [...arguments]);
        let viewName = name || methodName;
        let routerConfig = DecoratorHelper.getOwnMetadata(target, RequestMapping, new RequestMappingDecoratorMetadata(), true);
        // TODO: fix this with the refactoring
        let routeConfig = _.find(routerConfig.routes, {methodHandler: methodName});
        if (!routeConfig) {
            // NOTE: in case when @View is before @RequestMapping
            routeConfig = new RouterConfigItem(null, methodName);
            routerConfig.routes.push(routeConfig);
        }
        routeConfig.view = viewName;
    };
}
