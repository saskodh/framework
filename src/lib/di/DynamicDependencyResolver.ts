import { RequestContextHolder } from "../web/context/RequestContextHolder";

export class DynamicDependencyResolver {

    private fieldToken: Symbol;

    constructor(propertyToken: Symbol) {
        this.fieldToken = propertyToken;
    }

    getFieldGetter() {
        return () => {
            return RequestContextHolder.getInjector().getComponent(this.fieldToken);
        };
    }

    getFieldSetter() {
        return (value) => {
            RequestContextHolder.getInjector().register(this.fieldToken, value);
        };
    }
}