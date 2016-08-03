import { ComponentUtil } from "./ComponentDecorator";
import { ConfigurationUtil } from "./ConfigurationDecorator";

export function Profile(...profiles: Array<string>) {
    return function (target) {
        if (!ComponentUtil.isComponent(target)) {
            throw new Error('@Profile can be set only on @Component!');
        }
        profiles.forEach((profile) => ComponentUtil.getComponentData(target).profiles.push(profile));
    };
}

export function ActiveProfiles(...profiles: Array<string>) {
    return function (target) {
        if (!ConfigurationUtil.isConfigurationClass(target)) {
            throw new Error('@ActiveProfiles can be used only on @Configuration classes.');
        }
        ConfigurationUtil.getConfigurationData(target).activeProfiles.push(...profiles);
    };
}