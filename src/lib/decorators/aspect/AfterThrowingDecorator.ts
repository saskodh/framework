import { DecoratorUtil, DecoratorType } from "../../helpers/DecoratorUtils";
import { DecoratorHelper } from "../common/DecoratorHelper";
import { AdviceDecoratorMetadata } from "./AdviceDecoratorMetadata";
import { PointcutConfig, Pointcut } from "./AspectClasses";

export function AfterThrowing(config: PointcutConfig) {
    return function(target, targetMethod) {
        DecoratorUtil.throwOnWrongType(AfterThrowing, DecoratorType.METHOD, [...arguments]);

        let afterThrowingDecoratorMetadata =
            DecoratorHelper.getOwnMetadata(target, AfterThrowing, new AdviceDecoratorMetadata(), true);
        afterThrowingDecoratorMetadata.pointcuts.push(new Pointcut(config, targetMethod));
        DecoratorHelper.setMetadata(target, AfterThrowing, afterThrowingDecoratorMetadata);
    };
}
DecoratorHelper.createDecorator(AfterThrowing, DecoratorType.METHOD);