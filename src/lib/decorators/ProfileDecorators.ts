import { ComponentUtil } from "./ComponentDecorator";
import { ConfigurationUtil } from "./ConfigurationDecorator";
import { DecoratorUtil, DecoratorType } from "../helpers/DecoratorUtils";

export function Profile(...profiles: Array<string>) {
    return function (target) {
        DecoratorUtil.throwOnWrongType(Profile, DecoratorType.CLASS, [...arguments]);
        ComponentUtil.throwWhenNotOnComponentClass(Profile, [...arguments]);
        profiles.forEach((profile) => ComponentUtil.getComponentData(target).profiles.push(profile));
    };
}

export function ActiveProfiles(...profiles: Array<string>) {
    return function (target) {
        DecoratorUtil.throwOnWrongType(ActiveProfiles, DecoratorType.CLASS, [...arguments]);
        ConfigurationUtil.throwWhenNotOnConfigurationClass(ActiveProfiles, [...arguments]);
        ConfigurationUtil.getConfigurationData(target).activeProfiles.push(...profiles);
    };
}