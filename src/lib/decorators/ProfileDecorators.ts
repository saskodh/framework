import {ComponentUtil} from "./ComponentDecorator";
import {ConfigurationUtil} from "./ConfigurationDecorator";
import { DecoratorUtil, DecoratorType } from "../helpers/DecoratorUtils";
import {DecoratorHelper} from "./common/DecoratorHelper";
import {DecoratorMetadata} from "./common/DecoratorMetadata";

export class ProfileDecoratorMetadata extends DecoratorMetadata<ProfileDecoratorMetadata> {
    profiles: Array<string>;

    constructor() {
        super();
        this.profiles = [];
    }

    mergeMetadata(decoratorMetadata: ProfileDecoratorMetadata) {
        this.profiles.concat(decoratorMetadata.profiles);
    }
}
export function Profile(...profiles: Array<string>) {
    return function (target) {
        DecoratorUtil.throwOnWrongType(Profile, DecoratorType.CLASS, [...arguments]);
        ComponentUtil.throwWhenNotOnComponentClass(Profile, [...arguments]);
        profiles.forEach((profile) => {
            let profileDecoratorMetadata = <ProfileDecoratorMetadata> DecoratorHelper.getOwnMetadata(target,
                Profile, new ProfileDecoratorMetadata());
            profileDecoratorMetadata.profiles.push(profile);
            DecoratorHelper.setMetadata(target, Profile, profileDecoratorMetadata);
        });
    };
}
DecoratorHelper.createDecorator(Profile, DecoratorType.CLASS);

export class ActiveProfilesDecoratorMetadata extends DecoratorMetadata<ActiveProfilesDecoratorMetadata> {
    activeProfiles: Array<string>;

    constructor() {
        super();
        this.activeProfiles = [];
    }

    mergeMetadata(decoratorMetadata: ActiveProfilesDecoratorMetadata) {
        this.activeProfiles.concat(decoratorMetadata.activeProfiles);
    }
}
export function ActiveProfiles(...profiles: Array<string>) {
    return function (target) {
        DecoratorUtil.throwOnWrongType(ActiveProfiles, DecoratorType.CLASS, [...arguments]);
        ConfigurationUtil.throwWhenNotOnConfigurationClass(ActiveProfiles, [...arguments]);
        let activeProfilesDecoratorMetadata = <ActiveProfilesDecoratorMetadata> DecoratorHelper
            .getMetadataOrDefault(target, ActiveProfiles, new ActiveProfilesDecoratorMetadata());
        activeProfilesDecoratorMetadata.activeProfiles.push(...profiles);
        DecoratorHelper.setMetadata(target, ActiveProfiles, activeProfilesDecoratorMetadata);
    };
}
DecoratorHelper.createDecorator(ActiveProfiles, DecoratorType.CLASS);