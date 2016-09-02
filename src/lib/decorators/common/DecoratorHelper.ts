import { DecoratorType } from "../../helpers/DecoratorUtils";
import { ReflectUtils } from "../../helpers/ReflectUtils";
import * as _ from "lodash";
import { Decorator, DecoratorConfig } from "./DecoratorDefinition";
import { DecoratorMetadata } from "./DecoratorMetadata";

export class DecoratorHelper {

    // NOTE: override getMetadata to return the given default value if metadata does not exist.
    static getMetadata <T extends DecoratorMetadata<T>> (target: any, decorator: Function): T;
    static getMetadata <T extends DecoratorMetadata<T>> (target: any, decorator: Function, defaultValue: T): T;

    static getMetadata <T extends DecoratorMetadata<T>> (target: any, decorator: Function, defaultValue?: T): T {
        if (typeof target === "symbol") return undefined;

        let hierarchicalMetadata = ReflectUtils.getClassHierarchy(target)
            .map((target) => <T> DecoratorHelper.getOwnMetadata(target, decorator))
            .filter(Boolean);

        if (hierarchicalMetadata.length > 0) {
            let metadata = _.cloneDeep(hierarchicalMetadata.shift());
            for (let m of hierarchicalMetadata) {
                metadata.mergeMetadata(m);
            }
            return metadata;
        }
        return defaultValue;
    }

    static setMetadata <T> (target: any, decorator: Function, metadata: DecoratorMetadata<T>) {
        target[DecoratorHelper.getDecoratorConfig(decorator).token] = metadata;
    }

    static createDecorator(decorator: Function, ...decoratorTargets: DecoratorType[]): Decorator {
        let decoratorDefinition = <Decorator> <any> decorator;
        decoratorDefinition.config = new DecoratorConfig(decorator, ...decoratorTargets);
        return decoratorDefinition;
    }

    static getOwnMetadata <T extends DecoratorMetadata<T>> (target: any, decorator: Function): T;
    static getOwnMetadata <T extends DecoratorMetadata<T>> (target: any, decorator: Function, defaultValue: T, beforeInit?: boolean): T;

    static getOwnMetadata <T extends DecoratorMetadata<T>> (target: any, decorator: Function, defaultValue?: T, beforeInit?: boolean): T {
        let decoratorConfig = DecoratorHelper.getDecoratorConfig(decorator);
        if (beforeInit) return ReflectUtils.getOwnSymbolBeforeInit(target, decoratorConfig.token, decoratorConfig.target) || defaultValue;
        return ReflectUtils.getOwnSymbol(target, decoratorConfig.token, decoratorConfig.target) || defaultValue;
    }

    static getDecoratorConfig(decorator: Function): DecoratorConfig {
        return (<any> decorator).config;
    }

    static hasMetadata(target: any, decorator: Function): boolean {
        return !!DecoratorHelper.getMetadata(target, decorator);
    }
}