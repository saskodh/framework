import { RequestContextHolder } from "../web/context/RequestContextHolder";
import { Injector } from "./Injector";
import { DependencyData } from "../decorators/InjectionDecorators";
import * as _ from "lodash";

/**
 * Dynamic dependency resolver that will resolve the dependencies on run-time
 * from the RequestContext's injector or the given main injector as fallback.
 * */
export class DynamicDependencyResolver {

    private injector: Injector;
    private dependencyData: DependencyData;

    constructor(injector: Injector, dependencyData: DependencyData) {
        this.injector = injector;
        this.dependencyData = dependencyData;
    }

    /**
     * Returns configured property descriptor that can be set on an instance for resolving it's dependency dynamically.
     * @returns {PropertyDescriptor} configured property descriptor
     * */
    getPropertyDescriptor(): PropertyDescriptor {
        return {
            enumerable: true,
            configurable: true,
            get: this.getFieldGetter(),
            set: this.getFieldSetter()
        };
    }

    private getFieldGetter() {
        return () => {
            let dependency = this.getField(RequestContextHolder.getInjector()) || this.getField(this.injector);
            if (this.dependencyData.isArray && _.isUndefined(dependency)) {
                return [];
            }
            return dependency;
        };
    }

    private getFieldSetter() {
        return (value) => {
            RequestContextHolder.getInjector().register(this.dependencyData.token, value);
        };
    }

    private getField(injector: Injector) {
        try {
            return injector.getComponent(this.dependencyData.token);
        } catch (e) {
            // NOTE: component not registered error
        }
    }
}