import { EntryType, IApplicationContext, JoyContextOptions, Logger, Type } from "@symph/core";
import { MESSAGES } from "@symph/core/dist/constants";
import { isFunction, isNil } from "@symph/core/dist/utils/shared.utils";
import { ServerApplication } from "./server-application";
import { AbstractHttpAdapter } from "./adapters";
import { NestApplicationOptions } from "./interfaces/nest-application-options.interface";
import { NestApplicationContextOptions } from "./interfaces/nest-application-context-options.interface";
import { ServerContainer } from "./server-container";
import { HttpServer } from "./interfaces/http";
import { rethrow } from "./helpers/rethrow";
import { ExceptionsZone } from "./errors/exceptions-zone";
import { FastifyAdapter } from "./platform/fastify";
import { ServerConfiguration } from "./server.configuration";

export class ServerFactoryProtoClass<T extends ServerApplication, OPT extends Record<string, unknown> = {}> {
  protected logger = new Logger(`${this.serverApplicationClass.name}-factory`, true);
  protected abortOnError = true;

  constructor(public serverApplicationClass: { new (...args: any[]): T }) {}

  public async create(entry: EntryType | EntryType[], options?: NestApplicationOptions): Promise<T> {
    return this.createServer(entry, ServerConfiguration, options, undefined);
  }

  public async createServer(
    entry: EntryType | EntryType[],
    configurationClass: typeof ServerConfiguration = ServerConfiguration,
    options: NestApplicationOptions | OPT = {},
    parent?: IApplicationContext
  ): Promise<T> {
    this.applyLogger(options);
    // const httpServer = options.httpServer || this.createHttpAdapter();
    const appOptions = options;
    // const [httpServer, appOptions] = this.isHttpServer(serverOrOptions)
    //   ? [serverOrOptions, options]
    //   : [this.createHttpAdapter(), serverOrOptions];
    // const applicationConfig = new ApplicationConfig();
    this.setAbortOnError(appOptions);
    // const container = new ServerContainer();
    // container.applicationConfig = applicationConfig;
    const applicationContext = new this.serverApplicationClass(
      entry,
      configurationClass,
      // httpServer,
      // applicationConfig,
      appOptions,
      parent
    );
    await this.init(applicationContext);

    const target = this.createProxy(applicationContext);
    return target;
    // return this.createAdapterProxy(target, applicationContext.httpAdapter);
  }

  // public async createServer<T extends ServerApplication = ServerApplication>(
  //   entry: EntryType,
  //   serverOrOptions?: AbstractHttpAdapter | NestApplicationOptions,
  //   options?: JoyContextOptions,
  //   contextClass?: { new(...args: any[]): T }
  // ): Promise<T> {
  //   this.applyLogger(options);
  //   const _ContextClass = contextClass || ServerApplication;
  //   const [httpServer, appOptions] = this.isHttpServer(serverOrOptions)
  //     ? [serverOrOptions, options]
  //     : [this.createHttpAdapter(), serverOrOptions];
  //   const applicationConfig = new ApplicationConfig();
  //   this.setAbortOnError(appOptions);
  //   const container = new ServerContainer();
  //   container.applicationConfig = applicationConfig;
  //   const applicationContext = new _ContextClass(
  //     entry,
  //     httpServer,
  //     applicationConfig,
  //     container,
  //     appOptions
  //   );
  //
  //   await this.init(applicationContext);
  //
  //   const target = this.createProxy(applicationContext);
  //   return this.createAdapterProxy<T>(target, httpServer);
  // }

  protected async init(
    context: T
    // httpServer?: HttpServer
  ): Promise<T> {
    this.logger.log(MESSAGES.APPLICATION_START);
    try {
      // if (httpServer && httpServer.init) {
      //   await httpServer.init();
      // }
      await context.init();
    } catch (e) {
      this.logger.error("start error", e.stack);
      if (this.abortOnError) {
        process.abort();
      }
      throw e;
    }
    return context;
  }

  protected isHttpServer(serverOrOptions?: AbstractHttpAdapter | NestApplicationOptions): serverOrOptions is AbstractHttpAdapter {
    return !!(serverOrOptions && (serverOrOptions as AbstractHttpAdapter).patch);
  }

  protected setAbortOnError(options?: NestApplicationContextOptions | NestApplicationOptions) {
    this.abortOnError = !(options && options.abortOnError === false);
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

  private createExceptionZone(receiver: Record<string, any>, prop: string): Function {
    const teardown = this.abortOnError === false ? rethrow : undefined;

    return (...args: unknown[]) => {
      let result: unknown;
      ExceptionsZone.run(() => {
        result = receiver[prop](...args);
      }, teardown);

      return result;
    };
  }

  private createAdapterProxy<T>(app: ServerApplication, adapter: HttpServer): T {
    const proxy = new Proxy(app, {
      get: (receiver: Record<string, any>, prop: string) => {
        const mapToProxy = (result: unknown): any => {
          return result instanceof Promise ? result.then(mapToProxy) : result instanceof ServerApplication ? proxy : result;
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
    return proxy as unknown as T;
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
    // return new FastifyAdapter({
    //   serverFactory: ((handler, opts) => {
    //     const server = http.createServer((req, res) => {
    //       console.log('ddd')
    //       handler(req, res)
    //     })
    //     return server;
    //   })
    // });
  }
}

export const ServerFactory = new ServerFactoryProtoClass(ServerApplication);
