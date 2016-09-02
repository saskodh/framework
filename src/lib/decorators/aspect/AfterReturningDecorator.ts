import { DecoratorUtil, DecoratorType } from "../../helpers/DecoratorUtils";
import { DecoratorHelper } from "../common/DecoratorHelper";
import { AdviceDecoratorMetadata } from "./AdviceDecoratorMetadata";
import { PointcutConfig, Pointcut } from "./AspectClasses";

export function AfterReturning(config: PointcutConfig) {
    return function(target, targetMethod) {
        DecoratorUtil.throwOnWrongType(AfterReturning, DecoratorType.METHOD, [...arguments]);

        let afterReturningDecoratorMetadata =
            DecoratorHelper.getOwnMetadata(target, AfterReturning, new AdviceDecoratorMetadata(), true);
        afterReturningDecoratorMetadata.pointcuts.push(new Pointcut(config, targetMethod));
        DecoratorHelper.setMetadata(target, AfterReturning, afterReturningDecoratorMetadata);
    };
}
DecoratorHelper.createDecorator(AfterReturning, DecoratorType.METHOD);