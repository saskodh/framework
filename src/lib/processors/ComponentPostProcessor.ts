import { Component } from "../decorators/ComponentDecorator";
import { DecoratorType, DecoratorUtil } from "../helpers/DecoratorUtils";
import { StandaloneDecoratorMetadata } from "../decorators/common/DecoratorMetadata";
import { DecoratorHelper } from "../decorators/common/DecoratorHelper";

export interface IComponentPostProcessor {
    postProcessBeforeInit (componentConstructor);
    postProcessAfterInit (componentConstructor);
}

export function ComponentPostProcessor() {
    return function (target) {
        DecoratorUtil.throwOnWrongType(ComponentPostProcessor, DecoratorType.CLASS, [...arguments]);
        Component()(target);
        DecoratorHelper
            .setMetadata(target, ComponentPostProcessor, new PostProcessorDecoratorMetadata());
    };
}
DecoratorHelper.createDecorator(ComponentPostProcessor, DecoratorType.CLASS);

export class PostProcessorDecoratorMetadata extends
    StandaloneDecoratorMetadata<PostProcessorDecoratorMetadata> {

}

export class ComponentPostProcessorUtil {

    static isIComponentPostProcessor(arg: any): arg is IComponentPostProcessor {
        return (arg.postProcessBeforeInit !== undefined) && (arg.postProcessAfterInit !== undefined);
    }
}
