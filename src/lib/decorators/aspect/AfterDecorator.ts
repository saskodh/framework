import { DecoratorUtil, DecoratorType } from "../../helpers/DecoratorUtils";
import { DecoratorHelper } from "../common/DecoratorHelper";
import { AdviceDecoratorMetadata } from "./AdviceDecoratorMetadata";
import { PointcutConfig, Pointcut } from "./AspectClasses";

export function After(config: PointcutConfig) {
    return function(target, targetMethod) {
        DecoratorUtil.throwOnWrongType(After, DecoratorType.METHOD, [...arguments]);

        let afterDecoratorMetadata = DecoratorHelper.getOwnMetadata(target, After, new AdviceDecoratorMetadata());
        afterDecoratorMetadata.pointcuts.push(new Pointcut(config, targetMethod));
        DecoratorHelper.setMetadata(target, After, afterDecoratorMetadata);
    };
}
DecoratorHelper.createDecorator(After, DecoratorType.METHOD);