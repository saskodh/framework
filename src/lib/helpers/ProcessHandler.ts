import * as _ from "lodash";

export class ProcessHandler {
    listenersOnExit:Array<Function>;
    private static instance:ProcessHandler;

    constructor() {
        this.listenersOnExit = new Array<Function>();
        process.on('exit', (code) => {
            this.listenersOnExit.forEach((callback) => {
                if (_.isFunction(callback)) {
                    callback();
                }
            })
        });
        process.on('SIGINT', () => {
            process.exit();
        });
    }

    static getInstance() {
        if (this.instance === undefined) this.instance = new ProcessHandler();
        return this.instance;
    }

    registerOnExitListener(callback:Function) {
        this.listenersOnExit.push(callback);
        return () => {
            _.remove(this.listenersOnExit, function (val) {
                return val === callback;
            });
        }
    }
}