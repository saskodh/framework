import {ComponentUtil} from "./ComponentDecorator";

export function Qualifier(token: Symbol) {
    return function (target) {
        if (!ComponentUtil.isComponent(target)) {
            throw new Error('@Qualifier can be used only on @Component classes');
        }
        ComponentUtil.getAliasTokens(target).push(token);
    }
}