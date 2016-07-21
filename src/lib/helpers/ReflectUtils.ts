export class ReflectUtils {

    static getAllMethodsNames(clazz): Array<string> {
        let methodsNames = [];
        for (let currentClazz of this.getClassHierarchy(clazz)) {
            Reflect.ownKeys(currentClazz.prototype).forEach((methodName) => methodsNames.push(methodName));
        }
        return methodsNames;
    }

    static getClassHierarchy(clazz): Array<any> {
        let prototypeChain = [];

        let currentType = clazz;
        while (currentType.name !== '') {
            prototypeChain.push(currentType);
            currentType = Reflect.getPrototypeOf(currentType);
        }

        return prototypeChain;
    }
}