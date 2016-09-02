import { DecoratorUtil, DecoratorType } from "../../helpers/DecoratorUtils";
import { DecoratorHelper } from "../common/DecoratorHelper";
import { AdviceDecoratorMetadata } from "./AdviceDecoratorMetadata";
import { PointcutConfig, Pointcut } from "./AspectClasses";

export function Before(config: PointcutConfig) {
    return function(target, targetMethod) {
        DecoratorUtil.throwOnWrongType(Before, DecoratorType.METHOD, [...arguments]);

        let beforeDecoratorMetadata = DecoratorHelper.getOwnMetadata(target, Before, new AdviceDecoratorMetadata(), true);
        beforeDecoratorMetadata.pointcuts.push(new Pointcut(config, targetMethod));
        DecoratorHelper.setMetadata(target, Before, beforeDecoratorMetadata);
    };
}
DecoratorHelper.createDecorator(Before, DecoratorType.METHOD);