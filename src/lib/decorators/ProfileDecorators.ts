import * as _ from "lodash";
import { ComponentUtil } from "./ComponentDecorator";
import { ConfigurationUtil } from "./ConfigurationDecorator";

export function Profile(...profiles: Array<string>) {
    return function (target) {
        if (!ComponentUtil.isComponent(target)) {
            throw new Error('@Profile can be set only on @Component!');
        }
        profiles.forEach((profile) => {ComponentUtil.getComponentData(target).profiles.push(profile); });
    };
}

export function ActiveProfiles(...profiles: Array<string>) {
    return function (target) {
        if (!ConfigurationUtil.isConfigurationClass(target)) {
            throw new Error('@ActiveProfiles can be used only on @Configuration classes.');
        }
        let properties = ConfigurationUtil.getConfigurationData(target).properties;
        let allProfiles = _.cloneDeep(profiles);
        if (properties.has('application.profiles.active')) {
            allProfiles.push(...properties.get('application.profiles.active').split(","));
        }
        properties.set('application.profiles.active', allProfiles.join(','));
    };
}