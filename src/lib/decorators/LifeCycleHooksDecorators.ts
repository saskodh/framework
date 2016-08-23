import { DecoratorUsageError } from "../errors/DecoratorUsageErrors";
import { DecoratorUtil, DecoratorType } from "../helpers/DecoratorUtils";

const LIFE_CYCLE_HOOKS_TOKEN = Symbol('life_cycle_hooks_token');

export class LifeCycleHooksConfig {
    postConstructMethod: string;
    preDestroyMethod: string;
}

/**
 * Method decorator for post processing of components. The method is called after wiring the components.
 */
export function PostConstruct() {
    return function (target, methodName, descriptor: PropertyDescriptor) {
        DecoratorUtil.throwOnWrongType(PostConstruct, DecoratorType.METHOD, [...arguments]);
        let conf = LifeCycleHooksUtil.initIfDoesntExist(target);
        if (conf.postConstructMethod) {
            let errorParams = [conf.postConstructMethod, methodName].join(', ');
            let subjectName = DecoratorUtil.getSubjectName([...arguments]);
            throw new DecoratorUsageError(`@${PostConstruct.name} used on multiple methods (${errorParams}) ` +
                `within a @Component (${subjectName})`);
        }
        conf.postConstructMethod = methodName;
    };
}
/**
 * Method decorator for pre destruction of components. The method is called upon exiting the process.
 * Must do applicationContext.registerExitHook() for this to work.
 */
export function PreDestroy() {
    return function (target, methodName, descriptor: PropertyDescriptor) {
        DecoratorUtil.throwOnWrongType(PreDestroy, DecoratorType.METHOD, [...arguments]);
        let conf = LifeCycleHooksUtil.initIfDoesntExist(target);
        if (conf.preDestroyMethod) {
            let errorParams = [conf.preDestroyMethod, methodName].join(', ');
            let subjectName = DecoratorUtil.getSubjectName([...arguments]);
            throw new DecoratorUsageError(`@${PreDestroy.name} used on multiple methods (${errorParams}) ` +
                `within a @Component (${subjectName})`);
        }
        conf.preDestroyMethod = methodName;
    };
}

export class LifeCycleHooksUtil {

    static getConfig(target): LifeCycleHooksConfig {
        return target.prototype[LIFE_CYCLE_HOOKS_TOKEN] || new LifeCycleHooksConfig();
    }

    static initIfDoesntExist(target): LifeCycleHooksConfig {
        if (!target[LIFE_CYCLE_HOOKS_TOKEN]) {
            target[LIFE_CYCLE_HOOKS_TOKEN] = new LifeCycleHooksConfig();
        }
        return target[LIFE_CYCLE_HOOKS_TOKEN];
    }
}