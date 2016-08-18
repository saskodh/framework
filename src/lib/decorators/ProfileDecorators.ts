import { ComponentUtil } from "./ComponentDecorator";
import { ConfigurationUtil } from "./ConfigurationDecorator";

export function Profile(...profiles: Array<string>) {
    return function (target) {
        ComponentUtil.throwWhenNotOnComponentClass("@Profile", Array.prototype.slice.call(arguments));
        profiles.forEach((profile) => ComponentUtil.getComponentData(target).profiles.push(profile));
    };
}

export function ActiveProfiles(...profiles: Array<string>) {
    return function (target) {
        ConfigurationUtil.throwWhenNotOnConfigurationClass("@ActiveProfiles", Array.prototype.slice.call(arguments));
        ConfigurationUtil.getConfigurationData(target).activeProfiles.push(...profiles);
    };
}