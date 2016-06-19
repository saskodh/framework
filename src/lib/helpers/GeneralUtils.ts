import * as _ from "lodash";

export class GeneralUtils {

    static flattenObject (ob): Map<string, string> {
        var flatMap: Map<string, string> = new Map();
        _.forEach(ob, (value, prop) => {
            if (_.isString(value)) flatMap.set(prop, value);
            if (_.isObject(value)) {
                this.flattenObject(value)
                    .forEach((value, key) => flatMap.set(`${prop}.${key}`, value));
            }
        });
        return flatMap;
    };
}