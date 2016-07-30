import {AspectUtil, ProceedingJoinPoint, AdviceType} from "../AspectDecorator";
import {ProxyUtils} from "../../helpers/ProxyUtils";

export class AspectDefinitionPostProcessor {

    createAspects(aspects, appContext) {
        for (let AspectConstructor of aspects) {
            for (let advice of AdviceType.getAllAdviceTypes()) {
                let configutationData = this.getConfigurationData(AspectConstructor, advice);
                if (configutationData.length === 0) {continue; }

                for (let pointcut of configutationData.pointcuts) {
                    let clazz = pointcut.clazz.prototype;
                    let methodName = pointcut.originalMethod;
                    let originalMethod = clazz[methodName];

                    let targetMethod = AspectConstructor.prototype[pointcut.targetMethod];
                    let proxiedMethod =
                        this.createProxyMethod(originalMethod, targetMethod, AspectConstructor, appContext, advice);
                    Reflect.set(clazz, methodName, proxiedMethod);
                }
            }
        }
    }

    private getConfigurationData(AspectConstructor, advice) {
        if (AspectUtil.hasBefore(AspectConstructor.prototype) && advice === AdviceType.BEFORE) {
            return AspectUtil.getBeforePointcuts(AspectConstructor.prototype);
        } else if (AspectUtil.hasAfter(AspectConstructor.prototype) && advice === AdviceType.AFTER) {
            return AspectUtil.getAfterPointcuts(AspectConstructor.prototype);
        } else if (AspectUtil.hasAfterReturning(AspectConstructor.prototype) && advice === AdviceType.AFTER_RETURNING) {
            return AspectUtil.getAfterReturningPointcuts(AspectConstructor.prototype);
        } else if (AspectUtil.hasAfterThrowing(AspectConstructor.prototype) && advice === AdviceType.AFTER_THROWING) {
            return AspectUtil.getAfterThrowingPointcuts(AspectConstructor.prototype);
        } else if (AspectUtil.hasAround(AspectConstructor.prototype) && advice === AdviceType.AROUND) {
            return AspectUtil.getAroundPointcuts(AspectConstructor.prototype);
        } else {
            return [];
        }
    }

    private createProxyMethod(originalMethod, targetMethod, AspectConstructor, appContext, advice) {
        if (advice === AdviceType.BEFORE) {
            return this.createBeforeProxyMethod(originalMethod, targetMethod, AspectConstructor, appContext);
        } else if (advice === AdviceType.AFTER) {
            return this.createAfterProxyMethod(originalMethod, targetMethod, AspectConstructor, appContext);
        } else if (advice === AdviceType.AFTER_RETURNING) {
            return this.createAfterReturningProxyMethod(originalMethod, targetMethod, AspectConstructor, appContext);
        } else if (advice === AdviceType.AFTER_THROWING) {
            return this.createAfterThrowingProxyMethod(originalMethod, targetMethod, AspectConstructor, appContext);
        } else if (advice === AdviceType.AROUND) {
            return this.createAroundProxyMethod(originalMethod, targetMethod, AspectConstructor, appContext);
        }
    }

    private createBeforeProxyMethod(originalMethod, targetMethod, clazz, appContext) {
        return ProxyUtils.createMethodProxy(originalMethod, async(methodRef, thisArg, args) => {
            let comp = appContext.getComponent(clazz);
            await ProxyUtils.createMethodProxy(targetMethod, async (methodRef, thisArg = comp, args) => {
                await Promise.race([Reflect.apply(methodRef, thisArg, args)]);
            })();
            return await Promise.race([Reflect.apply(methodRef, thisArg, args)]);
        });
    }

    private createAfterProxyMethod(originalMethod, targetMethod, clazz, appContext) {
        return ProxyUtils.createMethodProxy(originalMethod, async(methodRef, thisArg, args) => {
            let promiseResult;
            try {
                promiseResult = await Promise.race([Reflect.apply(methodRef, thisArg, args)]);
            } catch (err) {
                promiseResult = err;
                throw Error(err);
            } finally {
                let comp = appContext.getComponent(clazz);
                await ProxyUtils.createMethodProxy(targetMethod, async (methodRef, thisArg = comp, args) => {
                    args[0] = promiseResult;
                    await Promise.race([Reflect.apply(methodRef, thisArg, args)]);
                })();
            }
            return promiseResult;
        });
    }

    private createAfterReturningProxyMethod(originalMethod, targetMethod, clazz, appContext) {
        return ProxyUtils.createMethodProxy(originalMethod, async(methodRef, thisArg, args) => {
            let promiseResult = await Promise.race([Reflect.apply(methodRef, thisArg, args)]);
            let comp = appContext.getComponent(clazz);
            await ProxyUtils.createMethodProxy(targetMethod, async (methodRef, thisArg = comp, args) => {
                args[0] = promiseResult;
                await Promise.race([Reflect.apply(methodRef, thisArg, args)]);
            })();
            return promiseResult;
        });
    }

    private createAfterThrowingProxyMethod(originalMethod, targetMethod, clazz, appContext) {
        return ProxyUtils.createMethodProxy(originalMethod, async(methodRef, thisArg, args) => {
            try {
                await Promise.race([Reflect.apply(methodRef, thisArg, args)]);
            } catch (err) {
                let comp = appContext.getComponent(clazz);
                await ProxyUtils.createMethodProxy(targetMethod, async (methodRef, thisArg = comp, args) => {
                    args[0] = err;
                    await Promise.race([Reflect.apply(methodRef, thisArg, args)]);
                })();
                throw err;
            }
        });
    }

    private createAroundProxyMethod(originalMethod, targetMethod, clazz, appContext) {
        return ProxyUtils.createMethodProxy(originalMethod, async(methodRef, thisArg, args) => {
            let comp = appContext.getComponent(clazz);
            let proceedingJoinPoint = new ProceedingJoinPoint(methodRef, thisArg, args);
            return await ProxyUtils.createMethodProxy(targetMethod, async(methodRef, thisArg = comp, args) => {
                args[0] = proceedingJoinPoint;
                return await Promise.race([Reflect.apply(methodRef, thisArg, args)]);
            })();
        });
    }
}