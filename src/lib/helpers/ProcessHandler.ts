import * as _ from "lodash";
import { BadArgumentError } from "../errors/BadArgumentError";

export class ProcessHandler {

    private static instance: ProcessHandler;

    private onExitListeners: Array<Function>;

    /**
     * It is recommended to have only one instance per application. Use getInstance() to get a singleton.
     */
    constructor() {
        this.onExitListeners = [];
        this.registerProcessExitEvents();
    }

    static getInstance() {
        if (this.instance === undefined) {
            this.instance = new ProcessHandler();
        }
        return this.instance;
    }

    registerOnExitListener(callback: Function) {
        if (!_.isFunction(callback)) {
            throw new BadArgumentError('Passed callback must be a function!');
        }

        this.onExitListeners.push(callback);
        return () => {
            _.remove(this.onExitListeners, function (val) {
                return val === callback;
            });
        };
    }

    private registerProcessExitEvents() {
        process.on('exit', () => this.onExitListeners.forEach((callback) => callback()));
        process.on('SIGINT', () => process.exit());
    }
}