import { ComponentFactory } from "../di/ComponentFactory";
import { Component } from "./ComponentDecorator";
import { DecoratorUsageError, DecoratorUsageTypeError } from "../errors/DecoratorUsageErrors";
import { DecoratorUtil, DecoratorType } from "../helpers/DecoratorUtils";
import { LoggerFactory } from "../helpers/logging/LoggerFactory";
import { DecoratorMetadata } from "./common/DecoratorMetadata";
import { DecoratorHelper } from "./common/DecoratorHelper";

let logger = LoggerFactory.getInstance();

export class ConfigurationDecoratorMetadata extends DecoratorMetadata<ConfigurationDecoratorMetadata> {

    componentFactory: ComponentFactory;
    componentDefinitionPostProcessorFactory: ComponentFactory;
    componentPostProcessorFactory: ComponentFactory;

    constructor() {
        super();
        this.componentFactory = new ComponentFactory();
        this.componentPostProcessorFactory = new ComponentFactory();
        this.componentDefinitionPostProcessorFactory = new ComponentFactory();
    }

    mergeMetadata(decoratorMetadata: ConfigurationDecoratorMetadata) {
        this.componentFactory.mergeComponentFactory(decoratorMetadata.componentFactory);
        this.componentDefinitionPostProcessorFactory
            .mergeComponentFactory(decoratorMetadata.componentDefinitionPostProcessorFactory);
        this.componentPostProcessorFactory.mergeComponentFactory(decoratorMetadata.componentPostProcessorFactory);
    }
}

export function Configuration() {
    return function (target) {
        DecoratorUtil.throwOnWrongType(Configuration, DecoratorType.CLASS, [...arguments]);
        if (DecoratorHelper.getOwnMetadata(target, Configuration)) {
            let subjectName = DecoratorUtil.getSubjectName([...arguments]);
            throw new DecoratorUsageError(`Duplicate @Configuration decorator' (${subjectName})`);
        }
        Component()(target);
        DecoratorHelper.setMetadata(target, Configuration, new ConfigurationDecoratorMetadata());
    };
}
DecoratorHelper.createDecorator(Configuration, DecoratorType.CLASS);

export class ConfigurationUtil {

    static getConfigurationData(target): ConfigurationDecoratorMetadata {
        if (!DecoratorHelper.hasMetadata(target, Configuration)) {
            let subjectName = DecoratorUtil.getSubjectName([...arguments]);
            throw new Error(`${subjectName} is not a @Configuration class`);
        }
        return <ConfigurationDecoratorMetadata> DecoratorHelper.getMetadata(target, Configuration);
    }

    static throwWhenNotOnConfigurationClass (decorator: Function, decoratorArgs: Array<any>, rootCause?: Error) {
        if (!DecoratorHelper.hasMetadata(decoratorArgs[0], Configuration)) {
            let subjectName = DecoratorUtil.getSubjectName(decoratorArgs);
                throw new DecoratorUsageTypeError(decorator, `@${Configuration.name} classes`,
                    subjectName, rootCause);
        }
    }
}