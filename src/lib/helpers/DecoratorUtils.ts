export class DecoratorType {
    static CLASS = 'class';
    static METHOD = 'method';
    static PROPERTY = 'property';
    static PARAMETER = 'parameter';

    static getAllTypes (): Array<string> {
        return [this.CLASS, this.METHOD, this.PROPERTY, this.PARAMETER];
    }
}


export class DecoratorUtil {

    static getType(args): string {
        if (args.length === 1) {
            return DecoratorType.CLASS;
        } else if (args.length === 2) {
            // NOTE: assumption valid for ES6+, if target is ES5 then the method decorators will also have 2 arguments
            return DecoratorType.PROPERTY;
        } else if (args.length === 3) {
            if (typeof args[2] === 'number') {
                return DecoratorType.PARAMETER;
            } else if (typeof args[2] === "undefined") {
                return DecoratorType.PROPERTY;
            } else {
                return DecoratorType.METHOD;
            }
        }
    }

    static isType(decoratorType, args): boolean {
        return this.getType(args) === decoratorType;
    }
}