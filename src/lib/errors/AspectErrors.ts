import { BaseError } from "./BaseError";

export class AspectErrorInfo {
    aspectClassName: string;
    aspectMethodName: string;
    subjectClassName: string;
    subjectMethodName: string;

    constructor(aspectClassName: string, aspectMethodName: string,
                subjectClassName: string, subjectMethodName: string) {
        this.aspectClassName = aspectClassName;
        this.aspectMethodName = aspectMethodName;
        this.subjectClassName = subjectClassName;
        this.subjectMethodName = subjectMethodName;
    }
}

export class AspectError extends BaseError {

    constructor(aspectErrorInfo: AspectErrorInfo, rootCause?: Error) {
        let message = `Advice ${aspectErrorInfo.aspectMethodName}() on Aspect ${aspectErrorInfo
            .aspectClassName} failed on ${aspectErrorInfo.subjectClassName}.${aspectErrorInfo.subjectMethodName}()`;
        super(message, rootCause);
    }
}

export class BeforeAdviceError extends AspectError {}

export class AfterAdviceError extends AspectError {}

export class AfterReturningAdviceError extends AspectError {}