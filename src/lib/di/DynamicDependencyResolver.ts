import {RequestContext} from "./RequestContext";

export class DynamicDependencyResolver {

    private fieldToken: Symbol;

    constructor(propertyToken: Symbol) {
        this.fieldToken = propertyToken;
    }

    getFieldGetter() {
        return () => {
            return RequestContext.getInjector().getComponent(this.fieldToken);
        }
    }

    getFieldSetter() {
        return (value) => {
            RequestContext.getInjector().register(this.fieldToken, value);
        }
    }
}