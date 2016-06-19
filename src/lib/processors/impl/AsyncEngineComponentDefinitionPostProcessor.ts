import {ComponentDefinitionPostProcessor} from "../ComponentDefinitionPostProcessor";
import {AsyncEngineHelper} from "../../helpers/AsyncEngineHelper";
import {ProxyUtils} from "../../helpers/ProxyUtils";
import {ReflectUtils} from "../../helpers/ReflectUtils";

export class AsyncEngineComponentDefinitionPostProcessor implements ComponentDefinitionPostProcessor {

    static getInstance() {
        return new AsyncEngineComponentDefinitionPostProcessor();
    }
    
    postProcessDefinition(componentConstructor) {
        var clazz = <FunctionConstructor> componentConstructor;
        class SubClass extends clazz {}
        return this.overrideGeneratorMethods(SubClass);
    }

    private overrideGeneratorMethods(classConstructor) {
        ReflectUtils.getAllMethodsNames(classConstructor).forEach((name) => {
            let method = classConstructor.prototype[name];
            if (AsyncEngineHelper.isAsyncMethod(method)) {
                var proxiedMethod = ProxyUtils.createMethodProxy(method, (methodRef, thisArg, args) => {
                    let handlerMethodIteratorInstance = methodRef.apply(thisArg, args);
                    return AsyncEngineHelper.runAsync(handlerMethodIteratorInstance);
                });

                Reflect.set(classConstructor.prototype, name, proxiedMethod);
            }
        });
        return classConstructor;
    }
}