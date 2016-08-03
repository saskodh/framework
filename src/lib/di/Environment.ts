import * as _ from "lodash";

export class Environment {
    private static properties: Map<string, string>;

    static getProperty(key: string, defaultValue?: string): string {
        if (_.isUndefined(this.properties)) {
            throw new Error('applicationContext has not been constructed');
        }
        if (!_.isUndefined(this.properties.get(key))) {
            return this.properties.get(key);
        }
        return defaultValue;
    }

    static containsProperty(key: string): boolean {
        if (_.isUndefined(this.properties)) {
            throw new Error('applicationContext has not been constructed');
        }
        return !!this.properties.get(key);
    }

    static getRequiredProperty(key: string): string {
        if (_.isUndefined(this.properties)) {
            throw new Error('applicationContext has not been constructed');
        }
        if (_.isUndefined(this.properties.get(key))) {
            throw new Error(`Property with key ${key} is not set in Environment properties.`);
        }
        return this.properties.get(key);
    }

    // TODO: implement the methods for profiles with issue #38 about profiles

    private static setProperties(properties: Map<string, string>) {  // tslint:disable-line
        if (_.isUndefined(this.properties)) {
            this.properties = new Map<string, string>();
        }
        properties.forEach((val, key) => {this.properties.set(key, val); });
    }
}