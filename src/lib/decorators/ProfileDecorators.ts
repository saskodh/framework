import {ComponentUtil, ComponentDecoratorMetadata, Component} from "./ComponentDecorator";
import {ConfigurationUtil, Configuration, ConfigurationDecoratorMetadata} from "./ConfigurationDecorator";
import { DecoratorUtil, DecoratorType } from "../helpers/DecoratorUtils";
import {DecoratorHelper} from "./common/DecoratorHelper";

export function Profile(...profiles: Array<string>) {
    return function (target) {
        DecoratorUtil.throwOnWrongType(Profile, DecoratorType.CLASS, [...arguments]);
        ComponentUtil.throwWhenNotOnComponentClass(Profile, [...arguments]);
        profiles.forEach((profile) => {
            let componentDecoratorMetadata = <ComponentDecoratorMetadata> DecoratorHelper.getOwnMetadata(target, Component);
            componentDecoratorMetadata.profiles.push(profile);
            DecoratorHelper.setMetadata(target, Component, componentDecoratorMetadata);
        });
    };
}

export function ActiveProfiles(...profiles: Array<string>) {
    return function (target) {
        DecoratorUtil.throwOnWrongType(ActiveProfiles, DecoratorType.CLASS, [...arguments]);
        ConfigurationUtil.throwWhenNotOnConfigurationClass(ActiveProfiles, [...arguments]);
        let configurationDecoratorMetadata = <ConfigurationDecoratorMetadata> DecoratorHelper.getMetadata(target, Configuration);
        configurationDecoratorMetadata.activeProfiles.push(...profiles);
        DecoratorHelper.setMetadata(target, Configuration, configurationDecoratorMetadata);
    };
}