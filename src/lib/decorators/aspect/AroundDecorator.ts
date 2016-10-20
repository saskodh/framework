import { DecoratorUtil, DecoratorType } from "../../helpers/DecoratorUtils";
import { DecoratorHelper } from "../common/DecoratorHelper";
import { AdviceDecoratorMetadata } from "./AdviceDecoratorMetadata";
import { Pointcut, PointcutConfig } from "./AspectClasses";

export function Around(config: PointcutConfig) {
    return function(target, targetMethod) {
        DecoratorUtil.throwOnWrongType(Around, DecoratorType.METHOD, [...arguments]);

        let aroundDecoratorMetadata = DecoratorHelper.getOwnMetadata(target, Around,
            new AdviceDecoratorMetadata());
        aroundDecoratorMetadata.pointcuts.push(new Pointcut(config, targetMethod));
        DecoratorHelper.setMetadata(target, Around, aroundDecoratorMetadata);
    };
}
DecoratorHelper.createDecorator(Around, DecoratorType.METHOD);

export class ProceedingJoinPoint {
    private methodRef;
    private thisArg;
    private args;

    constructor (methodRef, thisArg, args) {
        this.methodRef = methodRef;
        this.thisArg = thisArg;
        this.args = args;
    }

    async proceed(): Promise<any> {
        return await Promise.race([Reflect.apply(this.methodRef, this.thisArg, this.args)]);
    }
}