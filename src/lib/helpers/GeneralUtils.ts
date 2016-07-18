import * as _ from "lodash";

export class GeneralUtils {

    static flattenObject(ob):Map<string, string> {
        var flatMap:Map<string, string> = new Map();
        _.forEach(ob, (value, prop) => {
            if (_.isPlainObject(value)) {
                this.flattenObject(value)
                    .forEach((value, key) => flatMap.set(`${prop}.${key}`, value));
            } else if (_.isArray(value)) {
                flatMap.set(prop, value.join(','));
            } else {
                flatMap.set(prop, value);
            }
        });
        return flatMap;
    };
}