import { DecoratorType } from "../../helpers/DecoratorUtils";

/**
 * TODO: jsdoc
 */
export class DecoratorConfig {
    token: symbol;
    target: DecoratorType[];

    constructor(decorator: Function, ...decoratorTargets: DecoratorType[]) {
        this.token = Symbol(`${decorator.name}-token`);
        this.target = decoratorTargets;
    }
}

export interface DecoratorConfigType {
    config: DecoratorConfig;
}

export type Decorator = DecoratorConfigType & Function;