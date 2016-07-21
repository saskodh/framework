export interface MethodProxyCallback {
    (target, thisArg, args);
}

export class ProxyUtils {

    static createMethodProxy(method, callback: MethodProxyCallback) {
        return new Proxy(method, {apply: callback});
    }
}