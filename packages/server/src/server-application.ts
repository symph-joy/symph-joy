/**
 * @publicApi
 */
import { Abstract, ContextId, CoreContext, EntryType, ComponentWrapper, Logger, Type, ValueProvider } from "@symph/core";
import { ServerContainer } from "./server-container";
import { Resolver } from "./router/interfaces/resolver.interface";
import { RoutesResolver } from "./router/routes-resolver";
import { ApplicationConfig } from "./application-config";
import { INestApplication } from "./interfaces/nest-application.interface";
import { CorsOptions, CorsOptionsDelegate } from "./interfaces/external/cors-options.interface";
import { NestInterceptor } from "./interfaces/features/nest-interceptor.interface";
import { INestMicroservice } from "./interfaces/nest-microservice.interface";
import { ExceptionFilter } from "./interfaces/exceptions";
import { NestHybridApplicationOptions } from "./interfaces/microservices/nest-hybrid-application-options.interface";
import { INestApplicationContext } from "./interfaces/nest-application-context.interface";
import { WebSocketAdapter } from "./interfaces/websockets/web-socket-adapter.interface";
import { PipeTransform } from "./interfaces/features/pipe-transform.interface";
import { ShutdownSignal } from "./enums";
import { CanActivate } from "./interfaces/features/can-activate.interface";
import { NestApplicationOptions } from "./interfaces/nest-application-options.interface";
import { MESSAGES } from "@symph/core/dist/constants";
import { platform } from "os";
import { isNil } from "@symph/core/dist/utils/shared.utils";
import { UnknownElementException } from "./errors/exceptions/unknown-element.exception";
import { createContextId } from "./helpers";
import { AbstractHttpAdapter } from "./adapters";
import { SYMPH_CONFIG_INIT_VALUE } from "@symph/config";
import { ServerConfiguration } from "./server.configuration";

export class ServerApplication extends CoreContext implements INestApplication {
  private readonly logger = new Logger(ServerApplication.name, true);
  private routesResolver: Resolver;
  private httpServer: any;
  private isListening = false;

  protected config = new ApplicationConfig();
  public httpAdapter: AbstractHttpAdapter;
  public readonly container: ServerContainer;

  constructor(
    protected readonly entry: EntryType,
    public readonly configurationClass: typeof ServerConfiguration = ServerConfiguration,
    // public readonly httpAdapter: HttpServer,
    // protected readonly config: ApplicationConfig,
    protected readonly appOptions: NestApplicationOptions = {} // public container: ServerContainer = new ServerContainer()
  ) {
    super(entry, new ServerContainer());
  }

  protected async initContext(): Promise<ComponentWrapper[]> {
    const providers = await super.initContext();
    const thisProviders = this.registerModule([
      {
        [SYMPH_CONFIG_INIT_VALUE]: {
          name: SYMPH_CONFIG_INIT_VALUE,
          useValue: this.appOptions,
        } as ValueProvider,
        // httpAdapter: {
        //   name: "httpAdapter",
        //   type: Object,
        //   useValue: this.httpAdapter,
        // } as ValueProvider,
      },
      this.configurationClass,
    ]);
    await this.initHttp();
    return [...providers, ...thisProviders];
  }

  async init(): Promise<this> {
    await super.init();
    return this;
  }

  private async initHttp(): Promise<void> {
    this.httpAdapter = this.syncGet(AbstractHttpAdapter);
    this.container.setHttpAdapter(this.httpAdapter);
    this.routesResolver = new RoutesResolver(this.container, this.config, this.injector);
    this.httpServer = this.createServer();
    await this.httpAdapter.init();
  }

  public createServer<T = any>(): T {
    this.httpAdapter.initHttpServer();
    return this.httpAdapter.getHttpServer() as T;
  }

  protected async initProviders(instanceWrappers: ComponentWrapper[]): Promise<void> {
    await super.initProviders(instanceWrappers);
    if (this.hasInitialized()) {
      await this.registerRouter(instanceWrappers);
    }
  }

  // public async init(): Promise<this> {
  //   await super.init();
  //   // await this.registerRouter();
  //   // await this.callInitHook()
  //   // await this.registerRouterHooks();
  //   // await this.callBootstrapHook()
  //
  //   // this.isInitialized = true;
  //   this.logger.log("ServerApplication successfully started");
  //   return this;
  // }

  public async registerRouter(wrappers?: ComponentWrapper[]) {
    // await this.registerMiddleware(this.httpAdapter);

    const prefix = this.config.getGlobalPrefix();
    const basePath = prefix ? (prefix.charAt(0) !== "/" ? "/" + prefix : prefix) : "";
    this.routesResolver.resolve(this.httpAdapter, basePath, wrappers);
  }

  connectMicroservice<T extends object = any>(options: T, hybridOptions?: NestHybridApplicationOptions): INestMicroservice {
    // @ts-ignore
    return undefined;
  }

  enableCors(options?: CorsOptions | CorsOptionsDelegate<any>): void {}

  enableShutdownHooks(signals?: ShutdownSignal[] | string[]): this {
    // @ts-ignore
    return undefined;
  }

  public getHttpAdapter(): AbstractHttpAdapter {
    return this.httpAdapter as AbstractHttpAdapter;
  }

  public getHttpServer() {
    return this.httpServer;
  }

  public getMicroservices(): INestMicroservice[] {
    // return this.microservices;
    // @ts-ignore
    return undefined;
  }

  getUrl(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isListening) {
        this.logger.error(MESSAGES.CALL_LISTEN_FIRST);
        reject(MESSAGES.CALL_LISTEN_FIRST);
      }
      this.httpServer.on("listening", () => {
        const address = this.httpServer.address();
        if (typeof address === "string") {
          if (platform() === "win32") {
            return address;
          }
          const basePath = encodeURIComponent(address);
          return `${this.getProtocol()}+unix://${basePath}`;
        }
        let host = this.host();
        if (address && address.family === "IPv6") {
          if (host === "::") {
            host = "[::1]";
          } else {
            host = `[${host}]`;
          }
        } else if (host === "0.0.0.0") {
          host = "127.0.0.1";
        }
        resolve(`${this.getProtocol()}://${host}:${address.port}`);
      });
    });
  }

  public setViewEngine(engineOrOptions: any): this {
    this.httpAdapter.setViewEngine && this.httpAdapter.setViewEngine(engineOrOptions);
    return this;
  }

  private host(): string | undefined {
    const address = this.httpServer.address();
    if (typeof address === "string") {
      return undefined;
    }
    return address && address.address;
  }

  private getProtocol(): "http" | "https" {
    // return this.appOptions && this.appOptions.httpsOptions ? "https" : "http";
    return "http";
  }

  public async listen(port: number | string, callback?: () => void): Promise<any>;
  public async listen(port: number | string, hostname?: string, callback?: (err: Error) => void): Promise<any>;
  public async listen(port: number | string, ...args: any[]): Promise<any> {
    !this.isInitialized && (await this.init());
    this.isListening = true;
    await this.httpAdapter.listen(port, ...args);
    return this.httpServer;
  }

  listenAsync(port: number | string, hostname?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const server: any = this.listen(port, hostname, (e) => {
        if (e) {
          reject(e);
        }
        resolve(server);
      });
    });
  }

  registerRequestByContextId<T = any>(request: T, contextId: { id: number }): void {
    this.container.registerRequestProvider(request, contextId);
  }

  resolve<TInput = any>(typeOrToken: Type<TInput> | Abstract<TInput> | string, contextId = createContextId(), options?: { strict: boolean }): Promise<TInput> {
    return Promise.resolve(this.resolvePerContext(typeOrToken, contextId));
  }

  select<T>(module: Type<T>): INestApplicationContext {
    // @ts-ignore
    return undefined;
  }

  setGlobalPrefix(prefix: string): this {
    this.config.setGlobalPrefix(prefix);
    return this;
  }

  startAllMicroservices(callback?: () => void): this {
    // @ts-ignore
    return undefined;
  }

  startAllMicroservicesAsync(): Promise<void> {
    return Promise.resolve(undefined);
  }

  public use(...args: [any, any?]): this {
    this.httpAdapter.use(...args);
    return this;
  }

  public useGlobalFilters(...filters: ExceptionFilter[]): this {
    this.config.useGlobalFilters(...filters);
    return this;
  }

  public useGlobalGuards(...guards: CanActivate[]): this {
    this.config.useGlobalGuards(...guards);
    return this;
  }

  public useGlobalInterceptors(...interceptors: NestInterceptor[]): this {
    this.config.useGlobalInterceptors(...interceptors);
    return this;
  }

  public useGlobalPipes(...pipes: PipeTransform<any>[]): this {
    this.config.useGlobalPipes(...pipes);
    return this;
  }

  public useWebSocketAdapter(adapter: WebSocketAdapter): this {
    this.config.setIoAdapter(adapter);
    return this;
  }

  protected resolvePerContext<TInput = any>(
    typeOrToken: Type<TInput> | Abstract<TInput> | string,
    // contextModule: Module,
    contextId: ContextId
  ): Promise<TInput> | TInput {
    const instanceWrapper = this.container.getProvider<TInput>(typeOrToken);
    if (isNil(instanceWrapper)) {
      throw new UnknownElementException();
    }
    const provider = this.injector.loadProvider(instanceWrapper, this.container, contextId);
    return provider as Promise<TInput> | TInput;
  }

  public async close(): Promise<void> {
    await super.close();
    // await this.callDestroyHook();
    // await this.callBeforeShutdownHook();
    // await this.callShutdownHook();
    // this.unsubscribeFromProcessSignals();
  }

  protected async dispose(): Promise<void> {
    await super.dispose();

    // this.socketModule && (await this.socketModule.close());
    // this.microservicesModule && (await this.microservicesModule.close());
    this.httpAdapter && (await this.httpAdapter.close());

    // await Promise.all(
    //   iterate(this.microservices).map(async microservice => {
    //     microservice.setIsTerminated(true);
    //     await microservice.close();
    //   }),
    // );
  }
}
