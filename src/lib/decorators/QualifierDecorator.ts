import { ComponentUtil } from "./ComponentDecorator";
import { DecoratorUsageError } from "../errors/DecoratorUsageError";
import { DecoratorUtil } from "../helpers/DecoratorUtils";

export function Qualifier(token: Symbol) {
    return function (target) {
        if (!ComponentUtil.isComponent(target)) {
            let subjectName = DecoratorUtil.getSubjectName(Array.prototype.slice.call(arguments));
            throw new DecoratorUsageError(`@Qualifier can be used only on @Component classes! (${subjectName})`);
        }
        ComponentUtil.getAliasTokens(target).push(token);
    };
}