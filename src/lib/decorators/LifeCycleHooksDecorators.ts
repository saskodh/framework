import { DecoratorUsageError } from "../errors/DecoratorUsageErrors";
import { DecoratorUtil, DecoratorType } from "../helpers/DecoratorUtils";
import { StandaloneDecoratorMetadata } from "./common/DecoratorMetadata";
import { DecoratorHelper } from "./common/DecoratorHelper";

export class PostConstructDecoratorMetadata extends StandaloneDecoratorMetadata<PostConstructDecoratorMetadata> {
    postConstructMethod: string;
}

export class PreDestroyDecoratorMetadata extends StandaloneDecoratorMetadata<PreDestroyDecoratorMetadata> {
    preDestroyMethod: string;
}

/**
 * Method decorator for post processing of components. The method is called after wiring the components.
 */
export function PostConstruct() {
    return function (target, methodName, descriptor: PropertyDescriptor) {
        DecoratorUtil.throwOnWrongType(PostConstruct, DecoratorType.METHOD, [...arguments]);

        let conf = DecoratorHelper.getOwnMetadata(target, PostConstruct, new PostConstructDecoratorMetadata());

        if (conf.postConstructMethod) {
            let errorParams = [conf.postConstructMethod, methodName].join(', ');
            let subjectName = DecoratorUtil.getSubjectName([...arguments]);
            throw new DecoratorUsageError(`@${PostConstruct.name} used on multiple methods (${errorParams}) ` +
                `within a @Component (${subjectName})`);
        }
        conf.postConstructMethod = methodName;
        DecoratorHelper.setMetadata(target, PostConstruct, conf);
    };
}
DecoratorHelper.createDecorator(PostConstruct, DecoratorType.METHOD);
/**
 * Method decorator for pre destruction of components. The method is called upon exiting the process.
 * Must do applicationContext.registerExitHook() for this to work.
 */
export function PreDestroy() {
    return function (target, methodName, descriptor: PropertyDescriptor) {
        DecoratorUtil.throwOnWrongType(PreDestroy, DecoratorType.METHOD, [...arguments]);

        let conf = DecoratorHelper.getOwnMetadata(target, PreDestroy, new PreDestroyDecoratorMetadata());

        if (conf.preDestroyMethod) {
            let errorParams = [conf.preDestroyMethod, methodName].join(', ');
            let subjectName = DecoratorUtil.getSubjectName([...arguments]);
            throw new DecoratorUsageError(`@${PreDestroy.name} used on multiple methods (${errorParams}) ` +
                `within a @Component (${subjectName})`);
        }
        conf.preDestroyMethod = methodName;
        DecoratorHelper.setMetadata(target, PreDestroy, conf);
    };
}
DecoratorHelper.createDecorator(PreDestroy, DecoratorType.METHOD);