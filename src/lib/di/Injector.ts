import * as _ from "lodash";
import { InjectionError } from "../errors/InjectionError";

export class Injector {
    private components: Map<Symbol, Array<Object>>;

    constructor() {
        this.components = new Map();
    }

    register(token: Symbol, component: Object) {
        if (!this.components.has(token)) {
            this.components.set(token, []);
        }
        this.components.get(token).push(component);
    }

    getComponent(token: Symbol): Object {
        let components = this.components.get(token);
        if (_.isUndefined(components)) {
            throw new InjectionError('No such component registered');
        }
        if (components.length > 1) {
            throw new InjectionError(`Ambiguous injection. ${components.length} components found in the injector.`);
        }
        return components[0];
    }

    getComponents(token: Symbol): Array<Object> {
        return this.components.get(token) || [];
    }
}