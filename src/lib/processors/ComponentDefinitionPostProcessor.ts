import { Component } from "../decorators/ComponentDecorator";
import { DecoratorType, DecoratorUtil } from "../helpers/DecoratorUtils";
import { StandaloneDecoratorMetadata } from "../decorators/common/DecoratorMetadata";
import { DecoratorHelper } from "../decorators/common/DecoratorHelper";

export interface IComponentDefinitionPostProcessor {
    postProcessDefinition (componentConstructor: any): any;
}

export function ComponentDefinitionPostProcessor() {
    return function (target) {
        DecoratorUtil.throwOnWrongType(ComponentDefinitionPostProcessor, DecoratorType.CLASS, [...arguments]);
        Component()(target);
        DecoratorHelper
            .setMetadata(target, ComponentDefinitionPostProcessor, new DefinitionPostProcessorDecoratorMetadata());
    };
}
DecoratorHelper.createDecorator(ComponentDefinitionPostProcessor, DecoratorType.CLASS);

export class DefinitionPostProcessorDecoratorMetadata extends
    StandaloneDecoratorMetadata<DefinitionPostProcessorDecoratorMetadata> {

}

export class ComponentDefinitionPostProcessorUtil {

    static isIComponentDefinitionPostProcessor(arg: any): arg is IComponentDefinitionPostProcessor {
        return arg.postProcessDefinition !== undefined;
    }
}