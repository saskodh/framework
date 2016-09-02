import * as _ from "lodash";
import { DecoratorType } from "./DecoratorUtils";

export class ReflectUtils {

    static getAllMethodsNames(clazz): Array<string> {
        let methodsNames = [];
        for (let currentClazz of this.getClassHierarchy(clazz)) {
            Object.getOwnPropertyNames(currentClazz.prototype).forEach((methodName) => methodsNames.push(methodName));
        }
        return _.uniq(methodsNames);
    }

    // todo: add memoization to improve the performance
    static getClassHierarchy(clazz): Array<any> {
        let prototypeChain = [];

        let currentType = clazz;
        while (currentType.name !== '') {
            prototypeChain.push(currentType);
            currentType = Reflect.getPrototypeOf(currentType);
        }

        // todo: append Object in the class hierarchy
        // return [...prototypeChain, Object];
        return prototypeChain;
    }

    static getOwnSymbol(target: any, token: symbol, decoratorType: Array<DecoratorType>) {
        let allSymbols: Array<any> = [];
        if (decoratorType.indexOf(DecoratorType.CLASS) === -1) {
            allSymbols = Object.getOwnPropertySymbols(target.prototype);
            allSymbols = allSymbols.concat(Object.getOwnPropertySymbols(target));
        } else {
            allSymbols = Object.getOwnPropertySymbols(target);
            allSymbols = allSymbols.concat(Object.getOwnPropertySymbols(target.prototype));
        }
        if (allSymbols.indexOf(token) !== -1) {
            return target[token] || target.prototype[token];
        }
    }

    static getOwnSymbolBeforeInit(target: any, token: symbol, decoratorType: Array<DecoratorType>) {
        let allSymbols: Array<any> =  Object.getOwnPropertySymbols(target);
        if (allSymbols.indexOf(token) !== -1) {
            return target[token];
        }
    }
}