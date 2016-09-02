import { ProxyUtils } from "../../helpers/ProxyUtils";
import {
    ComponentDefinitionPostProcessor,
    IComponentDefinitionPostProcessor
} from "../ComponentDefinitionPostProcessor";
import { Injector } from "../../di/Injector";
import { ReflectUtils } from "../../helpers/ReflectUtils";
import { Order } from "../../decorators/OrderDecorator";
import { ComponentUtil } from "../../decorators/ComponentDecorator";
import {
    BeforeAdviceError, AfterReturningAdviceError, AfterAdviceError, AspectErrorInfo, AfterThrowingAdviceError
} from "../../errors/AspectErrors";
import { LoggerFactory } from "../../helpers/logging/LoggerFactory";
import { DecoratorHelper } from "../../decorators/common/DecoratorHelper";
import { AdviceDecoratorMetadata } from "../../decorators/aspect/AdviceDecoratorMetadata";
import { ProceedingJoinPoint } from "../../decorators/aspect/AroundDecorator";
import { AdviceType } from "../../decorators/aspect/AdviceType";

let logger = LoggerFactory.getInstance();

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
                let adviceDecoratorMetadata: AdviceDecoratorMetadata = DecoratorHelper
                    .getMetadata(AspectConstructor, adviceType.adviceDecorator, new AdviceDecoratorMetadata());
                for (let pointcut of adviceDecoratorMetadata.pointcuts) {
                    let componentName = ComponentUtil.getComponentData(componentConstructor).componentName;
                    if (componentName.match(<any> pointcut.pointcutConfig.classRegex) !== null) {
                        let componentMethodsNames = ReflectUtils.getAllMethodsNames(componentConstructor);
                        for (let methodName of componentMethodsNames) {
                            if (methodName.match(<any> pointcut.pointcutConfig.methodRegex) !== null) {
                                let aspectName = ComponentUtil.getComponentData(AspectConstructor).componentName;
                                logger.debug(`Setting advice ${pointcut
                                    .targetMethod}() from Aspect ${aspectName} on ${componentName}.${methodName}()`);
                                let joinPoint = AspectProxy.prototype[methodName];
                                let advice = AspectConstructor.prototype[pointcut.targetMethod];
                                let aspectErrorInfo = new AspectErrorInfo(aspectName,
                                    pointcut.targetMethod, componentName, methodName);
                                let proxiedMethod = this.adviceProxyMethods.get(adviceType.adviceName)
                                    .apply(this, [joinPoint, advice, aspectToken, aspectErrorInfo]);
                                Reflect.set(AspectProxy.prototype, methodName, proxiedMethod);
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
        this.adviceProxyMethods.set(AdviceType.BEFORE.adviceName, this.createBeforeProxyMethod);
        this.adviceProxyMethods.set(AdviceType.AFTER.adviceName, this.createAfterProxyMethod);
        this.adviceProxyMethods.set(AdviceType.AFTER_RETURNING.adviceName, this.createAfterReturningProxyMethod);
        this.adviceProxyMethods.set(AdviceType.AFTER_THROWING.adviceName, this.createAfterThrowingProxyMethod);
        this.adviceProxyMethods.set(AdviceType.AROUND.adviceName, this.createAroundProxyMethod);
    }

    private createBeforeProxyMethod(joinPoint, advice, aspectToken, aspectErrorInfo) {
        return ProxyUtils.createMethodProxy(joinPoint, async(joinPointRef, joinPointInstance, joinPointArgs) => {
            let aspectInstance = this.injector.getComponent(aspectToken);
            try {
                await Promise.race([Reflect.apply(advice, aspectInstance, [])]);
            } catch (err) {
                throw new BeforeAdviceError(aspectErrorInfo, err);
            }
            return await Promise.race([Reflect.apply(joinPointRef, joinPointInstance, joinPointArgs)]);
        });
    }

    private createAfterProxyMethod(joinPoint, advice, aspectToken, aspectErrorInfo) {
        return ProxyUtils.createMethodProxy(joinPoint, async(joinPointRef, joinPointInstance, joinPointArgs) => {
            // NOTE: the advice is executed even if the joinPoint throws
            let joinPointResult;
            let joinPointError;

            try {
                joinPointResult = await Promise.race([Reflect.apply(joinPointRef, joinPointInstance, joinPointArgs)]);
            } catch (err) {
                joinPointError = err;
                throw joinPointError;
            } finally {
                let aspectInstance = this.injector.getComponent(aspectToken);
                try {
                    await Promise.race([Reflect.apply(advice, aspectInstance, [joinPointError || joinPointResult])]);
                } catch (err) {
                    let afterAdviceError = new AfterAdviceError(aspectErrorInfo, err);
                    if (joinPointError) {
                        logger.error('Error while executing after advice. (Joinpoint also threw)\n%s',
                            afterAdviceError.stack);
                    } else {
                        throw afterAdviceError;
                    }
                }
            }

            return joinPointResult;
        });
    }

    private createAfterReturningProxyMethod(joinPoint, advice, aspectToken, aspectErrorInfo) {
        return ProxyUtils.createMethodProxy(joinPoint, async(joinPointRef, joinPointInstance, joinPointArgs) => {
            let joinPointResult = await Promise.race([Reflect.apply(joinPointRef, joinPointInstance, joinPointArgs)]);
            let aspectInstance = this.injector.getComponent(aspectToken);
            try {
                await Promise.race([Reflect.apply(advice, aspectInstance, [joinPointResult])]);
            } catch (err) {
                throw new AfterReturningAdviceError(aspectErrorInfo, err);
            }
            return joinPointResult;
        });
    }

    private createAfterThrowingProxyMethod(joinPoint, advice, aspectToken, aspectErrorInfo) {
        return ProxyUtils.createMethodProxy(joinPoint, async(joinPointRef, joinPointInstance, joinPointArgs) => {
            try {
                return await Promise.race([Reflect.apply(joinPointRef, joinPointInstance, joinPointArgs)]);
            } catch (err) {
                let aspectInstance = this.injector.getComponent(aspectToken);
                try {
                    await Promise.race([Reflect.apply(advice, aspectInstance, [err])]);
                } catch (error) {
                    logger.error('Error while executing after-throwing advice.\n%s',
                        new AfterThrowingAdviceError(aspectErrorInfo, error).stack);
                }
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