import * as _ from "lodash";

export class GeneralUtils {

    static flattenObject (ob): Map<string, string> {
        var flatMap: Map<string, string> = new Map();
        console.log('parsing object', ob);
        _.forEach(ob, (value, prop) => {
            console.log('for each: ', value, _.isObject(value), _.isArray(value));
            if (_.isPlainObject(value)) {
                this.flattenObject(value)
                    .forEach((value, key) => flatMap.set(`${prop}.${key}`, value));
            } else if (_.isArray(value)) {
                console.log('parsing array', value, value.join(','));
                flatMap.set(prop, value.join(','));
            } else {
                flatMap.set(prop, value);
            }
        });
        return flatMap;
    };
}