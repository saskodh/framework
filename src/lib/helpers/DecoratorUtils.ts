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

    static getType(args: Array<any>): string {
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

    static isType(decoratorType: DecoratorType, args: Array<any>): boolean {
        return this.getType(args) === decoratorType;
    }

    static getSubjectName (args: Array<any>) {
        if (this.isType(DecoratorType.CLASS, args)) {
            return args[0].name;
        }
        if (this.isType(DecoratorType.METHOD, args)) {
            return `${args[0].constructor.name}.${args[1]}()`;
        }
        return [args[0].constructor.name, args[1]].join('.');
    }
}