import {ComponentUtil} from "./ComponentDecorator";

export function Qualifier(token: Symbol) {
    return function (target) {
        ComponentUtil.getAliasTokens(target).push(token);
    }
}