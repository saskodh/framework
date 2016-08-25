import * as _ from "lodash";
import { ProcessHandler } from "../helpers/ProcessHandler";
import { Component } from "../decorators/ComponentDecorator";
import { PropertySourceUtil } from "../decorators/PropertySourceDecorator";
import { ProfiledPath } from "../decorators/ConfigurationDecorator";

@Component()
export class Environment {

    private ACTIVE_PROFILES_PROPERTY_KEY = 'application.profiles.active';
    private DEFAULT_PROFILES_PROPERTY_KEY = 'application.profiles.default';
    private processProperties: Map<string, string>;
    private nodeProperties: Map<string, string>;
    private processEnvProperties: Map<string, string>;
    private applicationProperties: Map<string, string>;
    private activeProfiles: Array<string>;

    constructor() {
        this.processProperties = ProcessHandler.getProcessProperties();
        this.nodeProperties = ProcessHandler.getNodeProperties();
        this.processEnvProperties = ProcessHandler.getEnvironmentProperties();
        this.applicationProperties = new Map<string, string>();
        this.activeProfiles = [];
    }

    getProperty(key: string, defaultValue?: string): string {
        if (this.processProperties.has(key)) {
            return this.processProperties.get(key);
        }
        if (this.nodeProperties.has(key)) {
            return this.nodeProperties.get(key);
        }
        if (this.processEnvProperties.has(key)) {
            return this.processEnvProperties.get(key);
        }
        if (this.applicationProperties.has(key)) {
            return this.applicationProperties.get(key);
        }
        return defaultValue;
    }

    containsProperty(key: string): boolean {
        return !!this.getProperty(key);
    }

    getRequiredProperty(key: string): string {
        if (_.isUndefined(this.getProperty(key))) {
            throw new Error(`Property with key ${key} is not set in Environment properties.`);
        }
        return this.getProperty(key);
    }

    acceptsProfiles(...profiles: Array<string>): boolean {
        if (profiles.length === 0) {
            throw Error('function called with no profiles');
        }
        let notUsedProfiles = profiles.filter((profile) => (profile[0] === '!'))
            .map((profile: string) => profile.substr(1));
        let activatedProfiles = this.getActiveProfiles();
        if (activatedProfiles.length === 0) {
            activatedProfiles = this.getDefaultProfiles();
        }
        return (_.intersection(activatedProfiles, profiles).length > 0) ||
            _.some(notUsedProfiles, (profile) => activatedProfiles.indexOf(profile) < 0);
    }

    getActiveProfiles(): Array<string> {
        return this.activeProfiles;
    }

    getDefaultProfiles(): Array<string> {
        if (_.isUndefined(this.getProperty(this.DEFAULT_PROFILES_PROPERTY_KEY))) {
            return [];
        }
        return this.getProperty(this.DEFAULT_PROFILES_PROPERTY_KEY).split(",");
    }

    setActiveProfiles(...activeProfiles: Array<string>) {
        this.activeProfiles.push(...activeProfiles);
        if (!_.isUndefined(this.getProperty(this.ACTIVE_PROFILES_PROPERTY_KEY))) {
            this.activeProfiles.push(...this.getProperty(this.ACTIVE_PROFILES_PROPERTY_KEY).split(','));
        }
        this.activeProfiles = _.uniq(this.activeProfiles);
    }

    setApplicationProperties(propertySourcePaths: Array<ProfiledPath>) {
        let isActiveProfilesPropertySet = (!_.isUndefined(this.getProperty(this.ACTIVE_PROFILES_PROPERTY_KEY)));
        let viablePaths = _.map(_.filter(propertySourcePaths, (profiledPath: ProfiledPath) =>
                (profiledPath.profiles.length === 0 || this.acceptsProfiles(...profiledPath.profiles))),
            (profiledPath: ProfiledPath) => profiledPath.path);
        PropertySourceUtil.getPropertiesFromPaths(...viablePaths)
            .forEach((value, prop) => {
                this.applicationProperties.set(prop, value);
            });
        if (!isActiveProfilesPropertySet && !_.isUndefined(this.getProperty(this.ACTIVE_PROFILES_PROPERTY_KEY))) {
            this.activeProfiles.push(...this.getProperty(this.ACTIVE_PROFILES_PROPERTY_KEY).split(','));
            this.activeProfiles = _.uniq(this.activeProfiles);
        }
    }
}