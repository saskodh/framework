import {Component} from "./ComponentDecorator";
import * as _ from "lodash";
import { DecoratorType, DecoratorUtil } from "../helpers/DecoratorUtils";

export class AdviceType {
    static BEFORE = 'before';
    static AFTER = 'after';
    static AFTER_RETURNING = 'after_returning';
    static AFTER_THROWING = 'after_throwing';
    static AROUND = 'around';

    static getAllAdviceTypes (): Array<any> {
        return [this.AFTER, this.AFTER_RETURNING, this.AFTER_THROWING, this.AROUND, this.BEFORE];
    }
}

export interface PointcutConfig {
    classRegex?: RegExp | string;
    methodRegex?: RegExp | string;
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

export const ASPECT_DECORATOR_TOKEN = Symbol('ASPECT_DECORATOR_TOKEN');
export function Aspect() {
    return function(target) {
        DecoratorUtil.throwOnWrongType(Aspect, DecoratorType.CLASS, [...arguments]);
        Component()(target);
        target[ASPECT_DECORATOR_TOKEN] = true;
    };
}

export class Pointcut {
    public pointcutConfig: PointcutConfig;
    public targetMethod: string;

    constructor(aspectConfig, targetMethod) {
        this.pointcutConfig = aspectConfig;
        this.targetMethod = targetMethod;
    }
}


export class PointcutList {
    pointcuts: Map<string, Array<Pointcut>>;

    constructor () {
        this.pointcuts = new Map();
        this.pointcuts.set(AdviceType.BEFORE, []);
        this.pointcuts.set(AdviceType.AFTER, []);
        this.pointcuts.set(AdviceType.AFTER_RETURNING, []);
        this.pointcuts.set(AdviceType.AFTER_THROWING, []);
        this.pointcuts.set(AdviceType.AROUND, []);
    }
}

export const ASPECT_POINTCUT_TOKEN = Symbol('ASPECT_POINTCUT_TOKEN');

export function Before(config: PointcutConfig) {
    return function(target, targetMethod) {
        DecoratorUtil.throwOnWrongType(Before, DecoratorType.METHOD, [...arguments]);
        AspectUtil.initPointcutListDoesntExist(target).pointcuts.get(AdviceType.BEFORE)
            .push(new Pointcut(config, targetMethod));
    };
}

export function After(config: PointcutConfig) {
    return function (target, targetMethod) {
        DecoratorUtil.throwOnWrongType(After, DecoratorType.METHOD, [...arguments]);
        AspectUtil.initPointcutListDoesntExist(target).pointcuts.get(AdviceType.AFTER)
            .push(new Pointcut(config, targetMethod));
    };
}

export function AfterReturning(config: PointcutConfig) {
    return function (target, targetMethod) {
        DecoratorUtil.throwOnWrongType(AfterReturning, DecoratorType.METHOD, [...arguments]);
        AspectUtil.initPointcutListDoesntExist(target).pointcuts.get(AdviceType.AFTER_RETURNING)
            .push(new Pointcut(config, targetMethod));
    };
}

export function AfterThrowing(config: PointcutConfig) {
    return function (target, targetMethod) {
        DecoratorUtil.throwOnWrongType(AfterThrowing, DecoratorType.METHOD, [...arguments]);
        AspectUtil.initPointcutListDoesntExist(target).pointcuts.get(AdviceType.AFTER_THROWING)
            .push(new Pointcut(config, targetMethod));
    };
}

export function Around(config: PointcutConfig) {
    return function (target, targetMethod) {
        DecoratorUtil.throwOnWrongType(Around, DecoratorType.METHOD, [...arguments]);
        let pointcutList = AspectUtil.initPointcutListDoesntExist(target);
        pointcutList.pointcuts.get(AdviceType.AROUND).push(new Pointcut(config, targetMethod));
    };
}

export class AspectUtil {

    static initPointcutListDoesntExist(target): PointcutList {
        if (_.isUndefined(target[ASPECT_POINTCUT_TOKEN])) {
            target[ASPECT_POINTCUT_TOKEN] = new PointcutList();
        }
        return target[ASPECT_POINTCUT_TOKEN];
    }

    static getPointcutList (target): PointcutList {
        return target[ASPECT_POINTCUT_TOKEN];
    }

    static getPointcuts(target, adviceType): Array<Pointcut> {
        if (this.getPointcutList(target) === undefined) {
            return [];
        }
        return this.getPointcutList(target).pointcuts.get(adviceType);
    }
}