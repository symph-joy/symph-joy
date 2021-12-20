/**
 * @publicApi
 */
import {
  Abstract,
  ComponentWrapper,
  ContextId,
  ApplicationContext,
  EntryType,
  IApplicationContext,
  Logger,
  TComponent,
  Type,
  ValueComponent,
} from "@symph/core";
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
import { ServerConfiguration } from "./server.configuration";
import { MountService } from "./mount/mount.service";
import { MountModule } from "./mount/mount-module";
import { CONFIG_INIT_VALUE } from "@symph/config";

type ServerAPPEntryType = EntryType | TComponent | MountModule | (EntryType | MountModule | TComponent)[];

export class ServerApplication extends ApplicationContext implements INestApplication {
  private readonly logger = new Logger(ServerApplication.name, true);
  private routesResolver: Resolver;
  protected httpServer: any;
  private isListening = false;

  protected config: ApplicationConfig;
  public httpAdapter: AbstractHttpAdapter;
  public readonly container: ServerContainer;
  public mountService: MountService;

  constructor(
    protected readonly entry: EntryType,
    public readonly configurationClass: typeof ServerConfiguration = ServerConfiguration,
    // public readonly httpAdapter: HttpServer,
    // protected readonly config: ApplicationConfig,
    protected readonly appOptions: NestApplicationOptions = {}, // public container: ServerContainer = new ServerContainer()
    public readonly parent: IApplicationContext | undefined
  ) {
    super(entry, parent);
    this.mountService = new MountService();
  }

  protected instanceContainer(): ServerContainer {
    return new ServerContainer();
  }

  protected async initContext(): Promise<void> {
    await super.initContext();
    const coreComps = [
      {
        name: CONFIG_INIT_VALUE,
        useValue: this.appOptions,
      } as ValueComponent,
      {
        name: Symbol("mountService"),
        type: MountService,
        useValue: this.mountService,
      },
      ...this.dependenciesScanner.scan(this.configurationClass),
    ];
    const coreWrappers = this.container.addProviders(coreComps);
    await this.createInstancesOfDependencies(coreWrappers);
    this.config = await this.get(ApplicationConfig);
    await this.initHttp();
  }

  async init(): Promise<this> {
    await super.init();
    return this;
  }

  protected async initHttp(): Promise<void> {
    this.httpAdapter = this.getSync(AbstractHttpAdapter);
    this.container.setHttpAdapter(this.httpAdapter);
    this.routesResolver = new RoutesResolver(this.container, this.config, this.injector, this.mountService);
    this.httpServer = this.createServer();
    await this.httpAdapter.init();
  }

  public createServer<T = any>(): T {
    this.httpAdapter.initHttpServer();
    return this.httpAdapter.getHttpServer() as T;
  }

  public registerModule(module: ServerAPPEntryType): ComponentWrapper[] {
    const modules = Array.isArray(module) ? module : [module];
    let wrappers = [] as ComponentWrapper[];
    for (const md of modules) {
      let providers: ComponentWrapper[];
      if ((md as MountModule).mount) {
        const mount = (md as MountModule).mount;
        const module = (md as MountModule).module;
        providers = super.registerModule(module);
        if (providers && providers.length > 0) {
          this.mountService.setMount(mount, providers);
        }
      } else {
        providers = super.registerModule(md as EntryType | TComponent);
      }
      if (!providers || providers.length === 0) {
        continue;
      }
      wrappers = wrappers.concat(providers);
    }
    return wrappers;
  }

  protected async initProviders(instanceWrappers: ComponentWrapper[]): Promise<void> {
    await super.initProviders(instanceWrappers);
    await this.registerRouter(instanceWrappers);
  }

  public async registerRouter(wrappers?: ComponentWrapper[]) {
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

  resolve<TInput = any>(
    typeOrToken: Type<TInput> | Abstract<TInput> | string,
    contextId = createContextId(),
    options?: { strict: boolean }
  ): Promise<TInput> {
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
    const provider = this.injector.loadProvider(instanceWrapper, contextId);
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
    if (this.httpAdapter) {
      await this.httpAdapter.close();
    }
    // await Promise.all(
    //   iterate(this.microservices).map(async microservice => {
    //     microservice.setIsTerminated(true);
    //     await microservice.close();
    //   }),
    // );
  }
}
