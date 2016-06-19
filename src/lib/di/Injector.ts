export class Injector {
    private components: Map<Symbol, Object>;

    constructor() {
        this.components = new Map();
    }

    register (token: Symbol, component: Object) {
        this.components.set(token, component);
    }

    getComponent (token: Symbol): Object {
        return this.components.get(token);
    }
}