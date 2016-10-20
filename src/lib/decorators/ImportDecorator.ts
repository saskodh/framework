import { ConfigurationUtil, Configuration } from "./ConfigurationDecorator";
import { DecoratorBadArgumentError } from "../errors/BadArgumentErrors";
import { DecoratorType, DecoratorUtil } from "../helpers/DecoratorUtils";
import { LoggerFactory } from "../helpers/logging/LoggerFactory";
import { DecoratorHelper } from "./common/DecoratorHelper";
import {DecoratorMetadata} from "./common/DecoratorMetadata";

let logger = LoggerFactory.getInstance();

export class ImportDecoratorMetadata extends DecoratorMetadata<ImportDecoratorMetadata> {
    configurationClasses: Array<any>;

    constructor() {
        super();
        this.configurationClasses = [];
    }

    mergeMetadata(decoratorMetadata: ImportDecoratorMetadata) {
        this.configurationClasses.concat(decoratorMetadata.configurationClasses);
    }
}

/**
 * Decorator used for composing configuration classes by importing other configuration classes.
 *
 * @param configurationClasses varargs configuration classes
 * @returns ClassDecorator for composing configuration classes
 * */
export function Import(...configurationClasses) {
    return function (targetConfigurationClass) {
        DecoratorUtil.throwOnWrongType(Import, DecoratorType.CLASS, [...arguments]);
        ConfigurationUtil.throwWhenNotOnConfigurationClass(Import, [...arguments]);
        let targetImportDecoratorMetadata = DecoratorHelper.getMetadataOrDefault(targetConfigurationClass, Import,
            new ImportDecoratorMetadata());
        for (let configurationClass of configurationClasses) {
            if (!DecoratorHelper.hasMetadata(configurationClass, Configuration)) {
                throw new DecoratorBadArgumentError(`${configurationClass.name} is not a configuration class.`,
                    Import, [...arguments]);
            }
        }
        targetImportDecoratorMetadata.configurationClasses = targetImportDecoratorMetadata.configurationClasses
            .concat(configurationClasses);
        DecoratorHelper.setMetadata(targetConfigurationClass, Import, targetImportDecoratorMetadata);
    };
}
DecoratorHelper.createDecorator(Import, DecoratorType.CLASS);