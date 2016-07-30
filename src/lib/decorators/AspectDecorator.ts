import {Component} from "./ComponentDecorator";
import * as _ from "lodash";

export class AdviceType {
    static BEFORE = 'before';
    static AFTER = 'after';
    static AFTER_RETURNING = 'after_returning';
    static AFTER_THROWING = 'after_throwing';
    static AROUND = 'around';

    static getAllAdviceTypes (): Array<any> {
        return [this.BEFORE, this.AFTER, this.AFTER_RETURNING, this.AFTER_THROWING, this.AROUND];
    }
}

export class ProceedingJoinPoint {
    private methodRef;
    private thisArg;
    private args;

    constructor (methodRef, thisArg, args) {
        this.methodRef = methodRef;
        this.thisArg = thisArg;
        this.args = args;
    }

    async proceed(): Promise<any> {
        let result = await Promise.race([Reflect.apply(this.methodRef, this.thisArg, this.args)]);
        return result;
    }
}

export const ASPECT_DECORATOR_TOKEN = Symbol('aspect-decoraor-token');
export function Aspect() {
    return function(target) {
        Component()(target);
        target[ASPECT_DECORATOR_TOKEN] = true;
    };
}


export class Pointcut {
    public clazz;
    public originalMethod;
    public targetMethod;

    constructor(clazz, originalMethod, targetMethod) {
        this.clazz = clazz;
        this.originalMethod = originalMethod;
        this.targetMethod = targetMethod;
    }
}

export class PointcutList {
    pointcuts: Array<Pointcut> = [];
}

export const ASPECT_BEFORE_TOKEN = Symbol('aspect_before_token');
export function Before(clazz, method) {
    return function(target, targetMethod) {
        if (!target[ASPECT_BEFORE_TOKEN]) {
            target[ASPECT_BEFORE_TOKEN] = new PointcutList();
        }
        target[ASPECT_BEFORE_TOKEN].pointcuts.push(new Pointcut(clazz, method, targetMethod));
    };
}

export const ASPECT_AFTER_TOKEN = Symbol('aspect_after_token');
export function After(clazz, method) {
    return function (target, targetMethod) {
        if (!target[ASPECT_AFTER_TOKEN]) {
            target[ASPECT_AFTER_TOKEN] = new PointcutList();
        }
        target[ASPECT_AFTER_TOKEN].pointcuts.push(new Pointcut(clazz, method, targetMethod));
    };
}

export const ASPECT_AFTER_RETURNING_TOKEN = Symbol('aspect_after_throwing_token');
export function AfterReturning(clazz, method) {
    return function (target, targetMethod) {
        if (!target[ASPECT_AFTER_RETURNING_TOKEN]) {
            target[ASPECT_AFTER_RETURNING_TOKEN] = new PointcutList();
        }
        target[ASPECT_AFTER_RETURNING_TOKEN].pointcuts.push(new Pointcut(clazz, method, targetMethod));
    };
}

export const ASPECT_AFTER_THROWING_TOKEN = Symbol('aspect_after_throwing_token');
export function AfterThrowing(clazz, method) {
    return function (target, targetMethod) {
        if (!target[ASPECT_AFTER_THROWING_TOKEN]) {
            target[ASPECT_AFTER_THROWING_TOKEN] = new PointcutList();
        }
        target[ASPECT_AFTER_THROWING_TOKEN].pointcuts.push(new Pointcut(clazz, method, targetMethod));
    };
}

export const ASPECT_AROUND_TOKEN = Symbol('aspect_around_token');
export function Around(clazz, method) {
    return function (target, targetMethod) {
        if (!target[ASPECT_AROUND_TOKEN]) {
            target[ASPECT_AROUND_TOKEN] = new PointcutList();
        }
        target[ASPECT_AROUND_TOKEN].pointcuts.push(new Pointcut(clazz, method, targetMethod));
    };
}

export class AspectUtil {
    static isAspect(target) {
        return !!target[ASPECT_DECORATOR_TOKEN];
    }

    static getBeforePointcuts(target) {
        return target[ASPECT_BEFORE_TOKEN];
    }

    static getAfterPointcuts(target) {
        return target[ASPECT_AFTER_TOKEN];
    }

    static getAfterReturningPointcuts(target) {
        return target[ASPECT_AFTER_RETURNING_TOKEN];
    }

    static getAfterThrowingPointcuts(target) {
        return target[ASPECT_AFTER_THROWING_TOKEN];
    }

    static getAroundPointcuts(target) {
        return target[ASPECT_AROUND_TOKEN];
    }

    static hasBefore(target): boolean {
        return !_.isEmpty(target[ASPECT_BEFORE_TOKEN]);
    }

    static hasAfter(target): boolean {
        return !_.isEmpty(target[ASPECT_AFTER_TOKEN]);
    }

    static hasAfterReturning(target): boolean {
        return !_.isEmpty(target[ASPECT_AFTER_RETURNING_TOKEN]);
    }

    static hasAfterThrowing(target): boolean {
        return !_.isEmpty(target[ASPECT_AFTER_THROWING_TOKEN]);
    }

    static hasAround(target): boolean {
        return !_.isEmpty(target[ASPECT_AROUND_TOKEN]);
    }
}