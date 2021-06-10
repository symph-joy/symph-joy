import {
  CoreContext,
  IJoyContext,
  JoyContainer,
  JoyContextOptions,
  Logger,
  Type,
} from "@symph/core";
import { MESSAGES } from "@symph/core/dist/constants";
import { isFunction, isNil } from "@symph/core/dist/utils/shared.utils";
import { ServerApplication } from "./server-application";
import { ServerProvidersConfig } from "./server-providers-config";
import { ApplicationConfig } from "./application-config";
import { AbstractHttpAdapter } from "./adapters";
import { NestApplicationOptions } from "./interfaces/nest-application-options.interface";
import { loadAdapter } from "./helpers/load-adapter";
import { NestApplicationContextOptions } from "./interfaces/nest-application-context-options.interface";
import { ServerContainer } from "./server-container";
import { HttpServer } from "./interfaces/http";
import { rethrow } from "./helpers/rethrow";
import { ExceptionsZone } from "./errors/exceptions-zone";
import { FastifyAdapter } from "./platform/fastify";
import { INestApplication } from "./interfaces/nest-application.interface";

export class ServerFactoryImplement {
  private readonly logger = new Logger("ServerFactory", true);
  private abortOnError = true;

  public async createServer<T extends ServerApplication = ServerApplication>(
    entry: Record<string, unknown> | Type = {},
    serverOrOptions?: AbstractHttpAdapter | NestApplicationOptions,
    options?: JoyContextOptions,
    contextClass?: { new (...args: any[]): T }
  ): Promise<T> {
    this.applyLogger(options);
    const _ContextClass = contextClass || ServerApplication;
    const [httpServer, appOptions] = this.isHttpServer(serverOrOptions)
      ? [serverOrOptions, options]
      : [this.createHttpAdapter(), serverOrOptions];
    const applicationConfig = new ApplicationConfig();
    this.setAbortOnError(serverOrOptions, options);
    const container = new ServerContainer();
    container.applicationConfig = applicationConfig;
    const applicationContext = new _ContextClass(
      entry,
      httpServer,
      applicationConfig,
      container
    );

    await this.init(applicationContext);

    const target = this.createProxy(applicationContext);
    return this.createAdapterProxy<T>(target, httpServer);
  }

  protected async init<T extends ServerApplication>(context: T): Promise<T> {
    this.logger.log(MESSAGES.APPLICATION_START);
    try {
      await context.init();
    } catch (e) {
      this.logger.error("start error", e.stack);
      process.abort();
    }
    return context;
  }

  private isHttpServer(
    serverOrOptions?: AbstractHttpAdapter | NestApplicationOptions
  ): serverOrOptions is AbstractHttpAdapter {
    return !!(
      serverOrOptions && (serverOrOptions as AbstractHttpAdapter).patch
    );
  }

  private setAbortOnError(
    serverOrOptions?: AbstractHttpAdapter | NestApplicationOptions,
    options?: NestApplicationContextOptions | NestApplicationOptions
  ) {
    this.abortOnError = this.isHttpServer(serverOrOptions)
      ? !(options && options.abortOnError === false)
      : !(serverOrOptions && serverOrOptions.abortOnError === false);
  }

  private createProxy(target: any) {
    const proxy = this.createExceptionProxy();
    return new Proxy(target, {
      get: proxy,
      set: proxy,
    });
  }

  private createExceptionProxy() {
    return (receiver: Record<string, any>, prop: string) => {
      if (!(prop in receiver)) {
        return;
      }
      if (isFunction(receiver[prop])) {
        return this.createExceptionZone(receiver, prop);
      }
      return receiver[prop];
    };
  }

  private createExceptionZone(
    receiver: Record<string, any>,
    prop: string
  ): Function {
    const teardown = this.abortOnError === false ? rethrow : undefined;

    return (...args: unknown[]) => {
      let result: unknown;
      ExceptionsZone.run(() => {
        result = receiver[prop](...args);
      }, teardown);

      return result;
    };
  }

  private createAdapterProxy<T>(
    app: ServerApplication,
    adapter: HttpServer
  ): T {
    const proxy = new Proxy(app, {
      get: (receiver: Record<string, any>, prop: string) => {
        const mapToProxy = (result: unknown): any => {
          return result instanceof Promise
            ? result.then(mapToProxy)
            : result instanceof ServerApplication
            ? proxy
            : result;
        };

        if (!(prop in receiver) && prop in adapter) {
          return (...args: unknown[]) => {
            const result = this.createExceptionZone(adapter, prop)(...args);
            return mapToProxy(result);
          };
        }
        if (isFunction(receiver[prop])) {
          return (...args: unknown[]) => {
            const result = receiver[prop](...args);
            return mapToProxy(result);
          };
        }
        return receiver[prop];
      },
    });
    return (proxy as unknown) as T;
  }

  protected applyLogger(options: JoyContextOptions | undefined): void {
    if (!options) {
      return;
    }
    !isNil(options.logger) && Logger.overrideLogger(options.logger);
  }

  private createHttpAdapter<T = any>(httpServer?: T): AbstractHttpAdapter {
    // const {ExpressAdapter} = loadAdapter(
    //   '@nestjs/platform-express',
    //   'HTTP',
    //   () => require('@nestjs/platform-express'),
    // );

    const { FastifyAdapter } = require("./platform/fastify");
    return new FastifyAdapter(httpServer);
  }
}

export const ServerFactory = new ServerFactoryImplement();
