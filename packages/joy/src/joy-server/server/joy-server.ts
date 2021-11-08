import { AutowireHook, Component, HookType, IHook, Optional, RuntimeException } from "@symph/core";
import { MountModule, ServerApplication } from "@symph/server";
import { pathToRegexp } from "path-to-regexp";
import { IncomingMessage } from "http";
import { JoyReactServer } from "./joy-react-server";
import { JoyAppConfig } from "./joy-app-config";

@Component()
export class JoyServer {
  @AutowireHook({ type: HookType.Traverse, async: true })
  public onDidServerInitialize: IHook;

  constructor(protected appContext: ServerApplication, public joyAppConfig: JoyAppConfig, @Optional() public reactServer: JoyReactServer) {}

  public async prepare(): Promise<void> {
    const { basePath } = this.joyAppConfig;
    const apiRoutePrefix = this.joyAppConfig.getGlobalPrefix();
    const reactPathReg = pathToRegexp(`${basePath || ""}/:path+`);
    const apiPathReg = new RegExp(`^${apiRoutePrefix}/?`);
    const reactHandler = this.reactServer ? this.reactServer.getRequestHandler() : undefined;
    this.appContext.use((req: IncomingMessage, res: any, next: any) => {
      const url = req.url;
      if (url) {
        // 未配置api前缀，则默认为后端应用，
        if (!apiRoutePrefix || apiPathReg.exec(url)) {
          return next();
        }
        if (reactHandler && (!basePath || reactPathReg.exec(url))) {
          return reactHandler(req, res);
        }
        // fixme 需要避免，在ssr时，页面内部再次请求了页面，会出现无限循环嵌套，导致node卡死。
      }
      throw new RuntimeException(`Can not handle request ${url}`);
    });

    await this.onDidServerInitialize.call();
    this.onDidServerInitialize.dispose();

    await Promise.all([this.prepareApiComponent(), this.reactServer ? this.reactServer.prepare() : undefined]);
  }

  public async prepareApiComponent(): Promise<void> {
    const joyServerModulesPath = this.joyAppConfig.resolveBuildOutDir("joy/server-bundle.js");
    const joyServerModules = require(joyServerModulesPath).default as any[];
    let joyGenComponents = [] as any[];
    for (let i = 0; i < joyServerModules.length; i++) {
      if (joyServerModules[i]["___JOY_GEN_PROVIDERS"]) {
        let components = (joyServerModules[i]["___JOY_GEN_PROVIDERS"] as any[]) || [];
        components.forEach((component) => {
          const { mount, module } = component;
          if (mount) {
            joyGenComponents.push(new MountModule(mount, module));
          } else {
            joyGenComponents.push(module);
          }
        });
        break;
      }
    }
    await this.appContext.loadModule([...joyGenComponents, ...joyServerModules]);
  }

  public async close(): Promise<void> {
    await this.reactServer.close();
  }
}
