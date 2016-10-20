import { DecoratorType } from "../../helpers/DecoratorUtils";
import { ReflectUtils } from "../../helpers/ReflectUtils";
import * as _ from "lodash";
import { Decorator, DecoratorConfig } from "./DecoratorDefinition";
import { DecoratorMetadata } from "./DecoratorMetadata";

export class DecoratorHelper {

    // NOTE: override getMetadata to return the given default value if metadata does not exist.
    static getMetadata <T extends DecoratorMetadata<T>> (target: any, decorator: Function): T;
    static getMetadata <T extends DecoratorMetadata<T>> (target: any, decorator: Function,
                                                         decoratorType: DecoratorType): T;

    static getMetadata <T extends DecoratorMetadata<T>> (target: any, decorator: Function,
                                                         decoratorType?: DecoratorType): T {

        // NOTE: class decorator add the metadata on the class
        // while all others (field, method, parameter) add the metadata on the class prototype
        let decoratorTypes = this.getDecoratorConfig(decorator).target;

        let hierarchicalMetadata = ReflectUtils.getClassHierarchy(target)
            .map((target) => {
                let metadataCarrier = this.getMetadataCarrier(target, decoratorTypes, decoratorType);
                return <T> DecoratorHelper.getOwnMetadata(metadataCarrier, decorator);
            })
            .filter(Boolean);

        if (hierarchicalMetadata.length > 0) {
            let metadata = <T> _.cloneDeep(hierarchicalMetadata.shift());
            for (let m of hierarchicalMetadata) {
                metadata.mergeMetadata(m);
            }
            return metadata;
        }
    }

    static getMetadataOrDefault <T extends DecoratorMetadata<T>> (target: any, decorator: Function, defaultValue: T): T;
    static getMetadataOrDefault <T extends DecoratorMetadata<T>> (target: any, decorator: Function, defaultValue: T,
                                                                  decoratorType: DecoratorType): T;
    static getMetadataOrDefault <T extends DecoratorMetadata<T>> (target: any, decorator: Function, defaultValue: T,
                                                                  decoratorType?: DecoratorType): T {
        return <T> this.getMetadata(target, decorator, decoratorType) || defaultValue;
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
    static getOwnMetadata <T extends DecoratorMetadata<T>> (target: any, decorator: Function, defaultValue: T): T;
    static getOwnMetadata <T extends DecoratorMetadata<T>> (target: any, decorator: Function, defaultValue?: T): T {
        let decoratorConfig = DecoratorHelper.getDecoratorConfig(decorator);
        if (!decoratorConfig) {
            throw new Error('Given decorator has not specified the decorator type');
        }
        return ReflectUtils.getOwnSymbol(target, decoratorConfig.token) || defaultValue;
    }

    static getDecoratorConfig(decorator: Function): DecoratorConfig {
        return (<any> decorator).config;
    }

    static hasMetadata(target: any, decorator: Function): boolean {
        return !!DecoratorHelper.getMetadata(target, decorator);
    }
    private static getMetadataCarrier(target, decoratorTypes: DecoratorType[],
                                      specificDecoratorType?: DecoratorType) {
        let isPrototypeDecorator = this.isPrototypeDecorator(decoratorTypes);
        let isClassDecorator = this.isClassDecorator(decoratorTypes);
        if (isClassDecorator && !isPrototypeDecorator) {
            return target;
        } else if (isPrototypeDecorator && !isClassDecorator) {
            return target.prototype;
        } else if (isClassDecorator && isPrototypeDecorator) {
            if (_.isUndefined(specificDecoratorType)) {
                throw new Error('You must specify the specific decorator type.')
            } else if (!_.includes(decoratorTypes, specificDecoratorType)) {
                throw new Error('Specific decorator type is incorrect');
            } else {
                return this.isClassDecorator([specificDecoratorType]) ? target : target.prototype;
            }
        }
    }

    private static isClassDecorator(decoratorTypes: DecoratorType[]): boolean {
        return _.includes(decoratorTypes, DecoratorType.CLASS);
    }

    private static isPrototypeDecorator(decoratorTypes: DecoratorType[]): boolean {
        for (let i = 0; i < decoratorTypes.length; i += 1) {
            if (decoratorTypes[i] === DecoratorType.PROPERTY ||
                decoratorTypes[i] === DecoratorType.METHOD ||
                decoratorTypes[i] === DecoratorType.PARAMETER) {
                return true;
            }
        }
        return false;
    }
}