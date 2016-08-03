import * as _ from "lodash";
import { ProcessHandler } from "../helpers/ProcessHandler";
import { Component } from "../decorators/ComponentDecorator";

@Component()
export class Environment {

    private  ACTIVE_PROFILES_PROPERTY_KEY = 'application.profiles.active';
    private  DEFAULT_PROFILES_PROPERTY_KEY = 'application.profiles.default';
    private  processProperties: Map<string, string>;
    private  nodeProperties: Map<string, string>;
    private  processEnvProperties: Map<string, string>;
    private  sourcePathProperties: Map<string, string>;
    private  activeProfiles: Array<string>;

    getProperty(key: string, defaultValue?: string): string {
        if (!_.isUndefined(this.processProperties.get(key))) {
            return this.processProperties.get(key);
        }
        if (!_.isUndefined(this.nodeProperties.get(key))) {
            return this.nodeProperties.get(key);
        }
        if (!_.isUndefined(this.processEnvProperties.get(key))) {
            return this.processEnvProperties.get(key);
        }
        if (!_.isUndefined(this.sourcePathProperties.get(key))) {
            return this.sourcePathProperties.get(key);
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
        if (_.isUndefined(this.getActiveProfiles())) {
            if (_.isUndefined(this.getDefaultProfiles())) {
                return false;
            }
            return (_.intersection(this.getDefaultProfiles(), profiles).length > 0);
        }
         return (_.intersection(this.getActiveProfiles(), profiles).length > 0);
    }

     getActiveProfiles(): Array<string> {
        return this.activeProfiles;
    }

     getDefaultProfiles(): Array<string> {
        if (_.isUndefined(this.getProperty(this.DEFAULT_PROFILES_PROPERTY_KEY))) {
            return undefined;
        }
        return this.getProperty(this.DEFAULT_PROFILES_PROPERTY_KEY).split(",");
    }

    constructor(sourcePathProperties: Map<string, string>, activeProfiles: Array<string>) {
        this.sourcePathProperties = _.cloneDeep(sourcePathProperties);
        this.processProperties = new Map<string, string>();
        this.nodeProperties = new Map<string, string>();
        this.processEnvProperties = new Map<string, string>();

        // sourcePathProperties.forEach((val, key) => {this.sourcePathProperties.set(key, val); });
        ProcessHandler.getInstance().getProcessProperties()
            .forEach((val, key) => {this.processProperties.set(key, val); });
        ProcessHandler.getInstance().getNodeProperties().forEach((val, key) => {this.nodeProperties.set(key, val); });
        ProcessHandler.getInstance().getEnvironmentProperties()
            .forEach((val, key) => {this.processEnvProperties.set(key, val); });

        this.activeProfiles = _.cloneDeep(activeProfiles);
        if (!_.isUndefined(this.getProperty(this.ACTIVE_PROFILES_PROPERTY_KEY))) {
            this.activeProfiles.push(...this.getProperty(this.ACTIVE_PROFILES_PROPERTY_KEY).split(','));
        }
    }
}