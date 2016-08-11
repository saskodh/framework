import * as _ from "lodash";
import { RequestMappingUtil, RouterConfigItem } from "../decorators/RequestMappingDecorator";
import { DecoratorUsageError } from "../errors/DecoratorUsageError";
import { DecoratorUtil, DecoratorType } from "../helpers/DecoratorUtils";

export function View(name?: string) {
    return function (target, methodName) {
        let args = Array.prototype.slice.call(arguments);
        if (!DecoratorUtil.isType(DecoratorType.METHOD, args)) {
            let subject = DecoratorUtil.getSubjectName(args);
            throw new DecoratorUsageError(`@View can be set only on methods of a @Component class! (${subject})`);
        }
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
