import { ComponentUtil } from "./ComponentDecorator";
import { DecoratorType, DecoratorUtil } from "../helpers/DecoratorUtils";

export function Qualifier(token: Symbol) {
    return function (target) {
        DecoratorUtil.throwOnWrongType(Qualifier, DecoratorType.CLASS, [...arguments]);
        ComponentUtil.throwWhenNotOnComponentClass(Qualifier, [...arguments]);
        ComponentUtil.getAliasTokens(target).push(token);
    };
}