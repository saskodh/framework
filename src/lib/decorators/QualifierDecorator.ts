import {ComponentUtil, Component, ComponentDecoratorMetadata} from "./ComponentDecorator";
import { DecoratorType, DecoratorUtil } from "../helpers/DecoratorUtils";
import {DecoratorHelper} from "./common/DecoratorHelper";

export function Qualifier(token: Symbol) {
    return function (target) {
        DecoratorUtil.throwOnWrongType(Qualifier, DecoratorType.CLASS, [...arguments]);
        ComponentUtil.throwWhenNotOnComponentClass(Qualifier, [...arguments]);

        let componentDecoratorMetadata = <ComponentDecoratorMetadata> DecoratorHelper.getOwnMetadata(target, Component);
        componentDecoratorMetadata.aliasTokens.push(token);
        DecoratorHelper.setMetadata(target, Component, componentDecoratorMetadata);
    };
}