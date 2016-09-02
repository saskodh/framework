import { DecoratorMetadata } from "../common/DecoratorMetadata";
import { Pointcut } from "./AspectClasses";

export class AdviceDecoratorMetadata extends DecoratorMetadata<AdviceDecoratorMetadata> {

    pointcuts: Array<Pointcut> = [];

    mergeMetadata(decoratorMetadata: AdviceDecoratorMetadata) {
        this.pointcuts = this.pointcuts.concat(decoratorMetadata.pointcuts);
    }
}