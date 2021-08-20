import clc from "cli-color";
import { Component } from "../decorators/core/component.decorator";
import { Optional } from "../decorators/core/optional.decorator";
import { isObject } from "../utils/shared.utils";

declare const process: any;
const cyan = clc.cyan;

// export type LogLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose';
export enum LogLevel {
  log = "log",
  error = "error",
  warn = "warn",
  debug = "debug",
  verbose = "verbose",
}

export interface LoggerService {
  log(message: any, context?: string): void;
  error(message: any, trace?: string, context?: string): void;
  warn(message: any, context?: string): void;
  debug?(message: any, context?: string): void;
  verbose?(message: any, context?: string): void;
}

@Component()
export class Logger implements LoggerService {
  private static logLevels: LogLevel[] = Object.values(LogLevel);
  private static lastTimestamp?: number;
  private static instance?: typeof Logger | LoggerService;

  constructor(@Optional() private readonly context?: string, @Optional() private readonly isTimestampEnabled = false) {}

  error(message: any, trace = "", context?: string) {
    const instance = this.getInstance();
    if (!this.isLogLevelEnabled(LogLevel.error)) {
      return;
    }
    instance && instance.error.call(instance, message, trace, context || this.context);
  }

  log(message: any, context?: string) {
    this.callFunction(LogLevel.log, message, context);
  }

  warn(message: any, context?: string) {
    this.callFunction(LogLevel.warn, message, context);
  }

  debug(message: any, context?: string) {
    this.callFunction(LogLevel.debug, message, context);
  }

  verbose(message: any, context?: string) {
    this.callFunction(LogLevel.verbose, message, context);
  }

  static overrideLogger(logger: LoggerService | LogLevel[] | boolean) {
    if (Array.isArray(logger)) {
      this.logLevels = logger;
      return;
    }
    this.instance = isObject(logger) ? (logger as LoggerService) : undefined;
  }

  static log(message: any, context = "", isTimeDiffEnabled = true) {
    this.printMessage(LogLevel.log, message, clc.green, context, isTimeDiffEnabled);
  }

  static error(message: any, trace = "", context = "", isTimeDiffEnabled = true) {
    this.printMessage(LogLevel.error, message, clc.red, context, isTimeDiffEnabled);
    this.printStackTrace(trace);
  }

  static warn(message: any, context = "", isTimeDiffEnabled = true) {
    this.printMessage(LogLevel.warn, message, clc.yellow, context, isTimeDiffEnabled);
  }

  static debug(message: any, context = "", isTimeDiffEnabled = true) {
    this.printMessage(LogLevel.debug, message, clc.magentaBright, context, isTimeDiffEnabled);
  }

  static verbose(message: any, context = "", isTimeDiffEnabled = true) {
    this.printMessage(LogLevel.verbose, message, clc.cyanBright, context, isTimeDiffEnabled);
  }

  private callFunction(name: LogLevel.verbose | LogLevel.debug | LogLevel.log | LogLevel.warn, message: any, context?: string) {
    if (!this.isLogLevelEnabled(name)) {
      return;
    }
    const instance = this.getInstance();
    const func = instance && (instance as typeof Logger)[name];
    func && func.call(instance, message, context || this.context, this.isTimestampEnabled);
  }

  private getInstance(): typeof Logger | LoggerService {
    const { instance } = Logger;
    if (!instance) {
      Logger.instance = Logger;
    }
    return instance === this ? Logger : instance!;
  }

  private isLogLevelEnabled(level: LogLevel): boolean {
    return Logger.logLevels.includes(level);
  }

  private static printMessage(logLevel: LogLevel, message: any, color: (message: string) => string, context = "", isTimeDiffEnabled?: boolean) {
    const output = isObject(message) ? `${color("Object:")}\n${JSON.stringify(message, null, 2)}\n` : color(message);

    const localeStringOptions: Parameters<Date["toLocaleString"]>[1] = {
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      day: "2-digit",
      month: "2-digit",
      hour12: false,
    };
    const timestamp = new Date(Date.now()).toLocaleString(undefined, localeStringOptions);

    let msgs: any[] = [];

    if (typeof window !== "undefined") {
      // in browser
      msgs = msgs.concat([color(`[Joy] ${logLevel} - `), timestamp, "   ", context && cyan(`[${context}] `), output, this.getTimestamp(isTimeDiffEnabled) || ""]);
      window.console.log(msgs.join(""));
    } else if (process) {
      // in node
      msgs = msgs.concat([color(`[Joy] ${process.pid} ${logLevel} - `), timestamp, "   ", context && cyan(`[${context}] `), output, this.getTimestamp(isTimeDiffEnabled)]);
      // msgs.forEach((item) => item && process.stdout.write(item));
      // process.stdout.write(`\n`);
    }
  }

  private static getTimestamp(isTimeDiffEnabled?: boolean) {
    const includeTimestamp = Logger.lastTimestamp && isTimeDiffEnabled;
    let rst;
    if (includeTimestamp) {
      rst = cyan(` +${Date.now() - (Logger.lastTimestamp || Date.now())}ms`);
    }
    Logger.lastTimestamp = Date.now();
    return rst;
  }

  private static printStackTrace(trace: string) {
    if (!trace) {
      return;
    }
    if (typeof window !== "undefined") {
      // in browser
      console.error(trace);
    } else if (process) {
      // in node
      process.stdout.write(trace);
      process.stdout.write(`\n`);
    }
  }
}
