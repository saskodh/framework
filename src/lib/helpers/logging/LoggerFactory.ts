import { loggers, transports, LoggerInstance, LoggerOptions, LogCallback } from "winston";

export interface LoggerMethod {
    (msg: string, callback: LogCallback): Logger;
    (msg: string, meta: any, callback: LogCallback): Logger;
    (msg: string, ... meta: any[]): Logger;
}

export interface Logger {
    debug: LoggerMethod;
    info: LoggerMethod;
    warn: LoggerMethod;
    error: LoggerMethod;
}

// FIXME winston issue [#814]: log statements are not in the correct order
export class LoggerFactory {

    public static FRAMEWORK_LOGGER_NAME = 'framework-logger';
    private static logger: LoggerInstance;

    static getInstance(): Logger {
        if (!this.logger) {
            this.logger = this.createFrameworkLogger();
        }
        return this.logger;
    }

    private static createFrameworkLogger(): LoggerInstance {
        return loggers.add(this.FRAMEWORK_LOGGER_NAME, this.getFrameworkLoggerOptions());
    }

    private static getFrameworkLoggerOptions(): LoggerOptions {
        return {
            transports: [
                new transports.Console({
                    handleExceptions: true,
                    level: process.env.LOG_LEVEL || 'debug',
                    timestamp: function () { return new Date().toISOString(); },
                    formatter: function (options) {
                        return `${options.timestamp()}  | ${options.level.toUpperCase()}\t| ${options.message}`;
                    }
                })
            ]
        };
    }
}

