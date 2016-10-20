import {ComponentUtil} from "./ComponentDecorator";
import { DecoratorType, DecoratorUtil } from "../helpers/DecoratorUtils";
import {DecoratorHelper} from "./common/DecoratorHelper";
import {DecoratorMetadata} from "./common/DecoratorMetadata";

export class QualifierDecoratorMetadata extends DecoratorMetadata<QualifierDecoratorMetadata> {
    aliasTokens: Array<Symbol>;

    constructor() {
        super();
        this.aliasTokens = [];
    }

    mergeMetadata(decoratorMetadata: QualifierDecoratorMetadata) {
        this.aliasTokens.concat(decoratorMetadata.aliasTokens);
    }
}

export function Qualifier(token: Symbol) {
    return function (target) {
        DecoratorUtil.throwOnWrongType(Qualifier, DecoratorType.CLASS, [...arguments]);
        ComponentUtil.throwWhenNotOnComponentClass(Qualifier, [...arguments]);

        let qualifierDecoratorMetadata = <QualifierDecoratorMetadata> DecoratorHelper.getOwnMetadata(target,
            Qualifier, new QualifierDecoratorMetadata());
        qualifierDecoratorMetadata.aliasTokens.push(token);
        DecoratorHelper.setMetadata(target, Qualifier, qualifierDecoratorMetadata);
    };
}
DecoratorHelper.createDecorator(Qualifier, DecoratorType.CLASS);