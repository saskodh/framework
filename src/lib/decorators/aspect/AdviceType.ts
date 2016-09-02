import { Before } from "./BeforeDecorator";
import { After } from "./AfterDecorator";
import { AfterReturning } from "./AfterReturningDecorator";
import { AfterThrowing } from "./AfterThrowingDecorator";
import { Around } from "./AroundDecorator";

export class AdviceType {
    static BEFORE: IAdviceInfo = { adviceName: 'before', adviceDecorator: Before };
    static AFTER: IAdviceInfo = { adviceName: 'after', adviceDecorator: After };
    static AFTER_RETURNING: IAdviceInfo = { adviceName: 'after-returning', adviceDecorator: AfterReturning };
    static AFTER_THROWING: IAdviceInfo = { adviceName: 'after-throwing', adviceDecorator: AfterThrowing };
    static AROUND: IAdviceInfo = { adviceName: 'around', adviceDecorator: Around };

    static getAllAdviceTypes (): Array<IAdviceInfo> {
        return [this.AFTER, this.AFTER_RETURNING, this.AFTER_THROWING, this.AROUND, this.BEFORE];
    }
}

export interface IAdviceInfo {
    adviceName;
    adviceDecorator;
}