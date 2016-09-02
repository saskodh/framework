export interface PointcutConfig {
    classRegex?: RegExp | string;
    methodRegex?: RegExp | string;
}

export class Pointcut {
    public pointcutConfig: PointcutConfig;
    public targetMethod: string;

    constructor(aspectConfig, targetMethod) {
        this.pointcutConfig = aspectConfig;
        this.targetMethod = targetMethod;
    }
}