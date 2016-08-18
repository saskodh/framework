import { ComponentUtil } from "./ComponentDecorator";

export function Qualifier(token: Symbol) {
    return function (target) {
        ComponentUtil.throwWhenNotOnComponentClass("@Qualifier", Array.prototype.slice.call(arguments));
        ComponentUtil.getAliasTokens(target).push(token);
    };
}