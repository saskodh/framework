import { ComponentUtil } from "./ComponentDecorator";
import { DecoratorUsageError } from "../errors/DecoratorUsageError";

export function Qualifier(token: Symbol) {
    return function (target) {
        if (!ComponentUtil.isComponent(target)) {
            throw new DecoratorUsageError(`@Qualifier can be used only on @Component classes! (${target.name})`);
        }
        ComponentUtil.getAliasTokens(target).push(token);
    };
}