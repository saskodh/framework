import * as _ from "lodash";

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

    static getOwnSymbol(target: any, token: symbol) {
        let ownTokens = Object.getOwnPropertySymbols(target);
        if (_.includes(ownTokens, token)) {
            return target[token];
        }
    }
}