import { Autowire, AutowireHook, Component, HookType, IHook, Optional, RuntimeException } from "@symph/core";
import { ServerApplication } from "@symph/server";
import { pathToRegexp } from "path-to-regexp";
import { IncomingMessage } from "http";
import { JoyReactServer } from "./joy-react-server";
import { JoyApiServer } from "./joy-api-server";

@Component()
export class JoyServer {
  @AutowireHook({ type: HookType.Traverse, async: true })
  public onDidServerInitialize: IHook;

  constructor(protected appContext: ServerApplication, @Optional() @Autowire() public reactServer: JoyReactServer, public apiServer: JoyApiServer) {}

  public async prepare(): Promise<void> {
    const apiUrlPath = pathToRegexp("/api/:path+");
    const apiHandler = this.apiServer.getRequestHandler();
    const reactHandler = this.reactServer ? this.reactServer.getRequestHandler() : undefined;
    this.appContext.use((req: IncomingMessage, res: any, next: any) => {
      const url = req.url;
      if (url && apiUrlPath.exec(url)) {
        return apiHandler(req, res, next);
      }
      if (reactHandler) {
        return reactHandler(req, res);
      }
      throw new RuntimeException(`Can not handle request ${url}`);
    });

    await this.onDidServerInitialize.call();
    this.onDidServerInitialize.dispose();

    await Promise.all([this.apiServer.prepare(), this.reactServer ? this.reactServer.prepare() : undefined]);
  }

  public async close(): Promise<void> {
    await this.reactServer.close();
    await this.apiServer.close();
  }
}
