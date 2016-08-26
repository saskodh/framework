import {AspectUtil, ProceedingJoinPoint, AdviceType} from "../../decorators/AspectDecorator";
import {ProxyUtils} from "../../helpers/ProxyUtils";
import {
    ComponentDefinitionPostProcessor,
    IComponentDefinitionPostProcessor
} from "../ComponentDefinitionPostProcessor";
import { Injector } from "../../di/Injector";
import { ReflectUtils } from "../../helpers/ReflectUtils";
import { Order } from "../../decorators/OrderDecorator";
import { ComponentUtil } from "../../decorators/ComponentDecorator";

@Order(1)
@ComponentDefinitionPostProcessor()
export class AspectDefinitionPostProcessor implements IComponentDefinitionPostProcessor {

    private aspectComponentDefinitions: Array<any>;
    private injector: Injector;
    private adviceProxyMethods: Map<string, any>;

    constructor() {
        this.initialize();
    }

    postProcessDefinition(componentConstructor: FunctionConstructor): any {

        class AspectProxy extends componentConstructor {}

        for (let AspectConstructor of this.aspectComponentDefinitions) {
            let aspectToken = ComponentUtil.getClassToken(AspectConstructor);
            for (let adviceType of AdviceType.getAllAdviceTypes()) {
                let pointcuts = AspectUtil.getPointcuts(AspectConstructor.prototype, adviceType);
                for (let pointcut of pointcuts) {
                    let componentName = ComponentUtil.getComponentData(componentConstructor).componentName;
                    if (componentName.match(<any> pointcut.pointcutConfig.classRegex)) {
                        let classMethods = ReflectUtils.getAllMethodsNames(componentConstructor);
                        for (let method of classMethods) {
                            if (method.match(<any> pointcut.pointcutConfig.methodRegex)) {
                                let joinPoint = AspectProxy.prototype[method];
                                let advice = AspectConstructor.prototype[pointcut.targetMethod];
                                let createProxyMethod = this.adviceProxyMethods.get(adviceType);
                                let proxiedMethod = createProxyMethod.apply(this, [joinPoint, advice, aspectToken]);

                                Reflect.set(AspectProxy.prototype, method, proxiedMethod);
                            }
                        }
                    }
                }
            }
        }
        return AspectProxy;
    }

    setAspectComponentDefinitions(aspectComponentDefinitions) {
        this.aspectComponentDefinitions = aspectComponentDefinitions;
    }

    setInjector(injector: Injector) {
        this.injector = injector;
    }

    private initialize() {
        this.adviceProxyMethods = new Map();
        this.adviceProxyMethods.set(AdviceType.BEFORE, this.createBeforeProxyMethod);
        this.adviceProxyMethods.set(AdviceType.AFTER, this.createAfterProxyMethod);
        this.adviceProxyMethods.set(AdviceType.AFTER_RETURNING, this.createAfterReturningProxyMethod);
        this.adviceProxyMethods.set(AdviceType.AFTER_THROWING, this.createAfterThrowingProxyMethod);
        this.adviceProxyMethods.set(AdviceType.AROUND, this.createAroundProxyMethod);
    }

    private createBeforeProxyMethod(joinPoint, advice, aspectToken) {
        return ProxyUtils.createMethodProxy(joinPoint, async(joinPointRef, joinPointInstance, joinPointArgs) => {
            let aspectInstance = this.injector.getComponent(aspectToken);
            await Promise.race([Reflect.apply(advice, aspectInstance, [])]);
            return await Promise.race([Reflect.apply(joinPointRef, joinPointInstance, joinPointArgs)]);
        });
    }

    private createAfterProxyMethod(joinPoint, advice, aspectToken) {
        return ProxyUtils.createMethodProxy(joinPoint, async(joinPointRef, joinPointInstance, joinPointArgs) => {
            // NOTE: the advice is executed even if the joinPoint throws
            let joinPointResult;
            try {
                joinPointResult = await Promise.race([Reflect.apply(joinPointRef, joinPointInstance, joinPointArgs)]);
            } catch (err) {
                joinPointResult = err;
                throw err;
            } finally {
                let aspectInstance = this.injector.getComponent(aspectToken);
                await Promise.race([Reflect.apply(advice, aspectInstance, [joinPointResult])]);
            }
            return joinPointResult;
        });
    }

    private createAfterReturningProxyMethod(joinPoint, advice, aspectToken) {
        return ProxyUtils.createMethodProxy(joinPoint, async(joinPointRef, joinPointInstance, joinPointArgs) => {
            let joinPointResult = await Promise.race([Reflect.apply(joinPointRef, joinPointInstance, joinPointArgs)]);
            let aspectInstance = this.injector.getComponent(aspectToken);
            await Promise.race([Reflect.apply(advice, aspectInstance, [joinPointResult])]);
            return joinPointResult;
        });
    }

    private createAfterThrowingProxyMethod(joinPoint, advice, aspectToken) {
        return ProxyUtils.createMethodProxy(joinPoint, async(joinPointRef, joinPointInstance, joinPointArgs) => {
            try {
                await Promise.race([Reflect.apply(joinPointRef, joinPointInstance, joinPointArgs)]);
            } catch (err) {
                let aspectInstance = this.injector.getComponent(aspectToken);
                await Promise.race([Reflect.apply(advice, aspectInstance, [err])]);
                throw err;
            }
        });
    }

    private createAroundProxyMethod(joinPoint, advice, aspectToken) {
        return ProxyUtils.createMethodProxy(joinPoint, async(joinPointRef, joinPointInstance, joinPointArgs) => {
            let aspectInstance = this.injector.getComponent(aspectToken);
            let proceedingJoinPoint = new ProceedingJoinPoint(joinPointRef, joinPointInstance, joinPointArgs);
            return await Promise.race([Reflect.apply(advice, aspectInstance, [proceedingJoinPoint])]);
        });
    }
}