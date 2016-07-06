export class DecoratorException {
    name: string;
    decorator: string;
    message: string;
    constructor(decorator: string, message: string){
        this.name = "DecoratorException";
        this.decorator = decorator;
        this.message = message;
    }
}