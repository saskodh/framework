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

    static getPromise(thisArg, method, ...args):Promise<any> {
        return new Promise((resolve, reject) => {
            let callback = function (error, result) {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            };

            args.push(callback);
            Reflect.apply(method, thisArg, args);
        });
    }
}