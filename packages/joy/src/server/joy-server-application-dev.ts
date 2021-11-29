import { Autowire, Component, EntryType, IApplicationContext, RuntimeException, ValueProvider } from "@symph/core";
import { All, Controller, HttpException, HttpStatus, NestApplicationOptions } from "@symph/server";
import HotReloader from "./hot-reloader";
import { JoyServerApplication } from "../joy-server/server/joy-server-application";
import { ServerConfiguration } from "@symph/server/dist/server.configuration";
import { IncomingMessage } from "http";

@Component()
export class JoyServerApplicationDev extends JoyServerApplication {
  protected hotReloader: HotReloader;

  public devError: Error | undefined;

  protected isRestarting = false;

  // 收集所有的socket连接, 在关闭http.Server之前，得先销毁socket连接，否则http.Server.close()方法将一直等待所以的连接完成后才会返回。
  private httpServerSockets = new Set();

  constructor(
    protected readonly entry: EntryType,
    public readonly configurationClass: typeof ServerConfiguration = ServerConfiguration,
    protected readonly appOptions: NestApplicationOptions = {}, // public container: ServerContainer = new ServerContainer()
    public readonly parent: IApplicationContext | undefined
  ) {
    super(entry, configurationClass, appOptions, parent);
  }

  public setDevError(err?: Error) {
    this.devError = err;
  }

  protected async initHttp(): Promise<void> {
    await super.initHttp();

    this.httpServer.on("connection", (socket: any) => {
      this.httpServerSockets.add(socket);
      socket.on("close", () => {
        this.httpServerSockets.delete(socket);
      });
    });
  }

  private destroySockets(sockets: Set<any>) {
    for (const socket of sockets.values()) {
      socket.destroy();
    }
  }

  protected dispose(): Promise<void> {
    this.destroySockets(this.httpServerSockets);
    return super.dispose();
  }

  protected async initContext(): Promise<void> {
    await super.initContext();
    this.hotReloader = await this.get(HotReloader);
  }

  async prepare(): Promise<void> {
    this.use((req: IncomingMessage, res: any, next: any) => {
      if (this.devError) {
        throw new HttpException(
          {
            message: this.devError?.message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      } else {
        next();
      }
    });

    return super.prepare();
  }

  async prepareApiComponent(): Promise<void> {
    await this.hotReloader.start();
    if (this.devError) {
      // 出现错误时，不加载任何业务组件，修正后再重新加载。
    } else {
      const genFilePath = this.config.resolveAutoGenOutDir("./joy/server-providers.config.js");
      await this.hotReloader.ensureModules([genFilePath]);
      await super.prepareApiComponent();
    }
  }
}
