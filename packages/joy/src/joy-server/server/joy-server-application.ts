import { AutowireHook, Component, EntryType, HookType, ICoreContext, IHook, RuntimeException } from "@symph/core";
import { MountModule, NestApplicationOptions, ServerApplication } from "@symph/server";
import { pathToRegexp } from "path-to-regexp";
import { IncomingMessage } from "http";
import { JoyReactServer } from "./joy-react-server";
import { JoyAppConfig } from "./joy-app-config";
import { ServerConfiguration } from "@symph/server/dist/server.configuration";

@Component()
export class JoyServerApplication extends ServerApplication {
  protected config: JoyAppConfig;

  @AutowireHook({ type: HookType.Traverse, async: true })
  public onDidServerInitialize: IHook;

  public reactServer: JoyReactServer | undefined;

  public reactPathReg: RegExp;
  public apiPathReg: RegExp;

  constructor(
    protected readonly entry: EntryType,
    public readonly configurationClass: typeof ServerConfiguration = ServerConfiguration,
    protected readonly appOptions: NestApplicationOptions = {}, // public container: ServerContainer = new ServerContainer()
    public readonly parent: ICoreContext | undefined
  ) {
    super(entry, configurationClass, appOptions, parent);
  }

  protected async initContext(): Promise<void> {
    await super.initContext();
    this.reactServer = await this.tryGet(JoyReactServer);

    const { basePath } = this.config;
    const apiRoutePrefix = this.config.getGlobalPrefix();
    this.apiPathReg = new RegExp(`^${basePath || ""}${apiRoutePrefix}/?`);
    this.reactPathReg = pathToRegexp(`${basePath || ""}/:path*`);
  }

  public async prepare(): Promise<void> {
    const apiRoutePrefix = this.config.getGlobalPrefix();
    const reactPathReg = this.reactPathReg;
    const apiPathReg = this.apiPathReg;
    const reactHandler = this.reactServer ? this.reactServer.getRequestHandler() : undefined;
    this.use((req: IncomingMessage, res: any, next: any) => {
      // const url = (req.url && new URL(req.url as string, `http://${req.headers.host}`)) || undefined
      let urlPathname = req.url || "";
      if (urlPathname.indexOf("?")) {
        urlPathname = urlPathname.slice(0, urlPathname.indexOf("?"));
      }

      // 未配置api前缀，则默认为后端应用，
      if (!apiRoutePrefix || apiPathReg.exec(urlPathname)) {
        return next();
      }
      if (reactHandler && reactPathReg.exec(urlPathname)) {
        return reactHandler(req, res);
      }
      // fixme 需要避免，在ssr时，页面内部再次请求了页面，会出现无限循环嵌套，导致node卡死。

      throw new RuntimeException(`Can not handle request path ${urlPathname}`);
    });

    await this.onDidServerInitialize.call();
    this.onDidServerInitialize.dispose();

    await Promise.all([this.prepareApiComponent(), this.reactServer ? this.reactServer.prepare() : undefined]);
  }

  public async prepareApiComponent(): Promise<void> {
    const joyServerModulesPath = this.config.resolveBuildOutDir("joy/server-bundle.js");
    const joyServerModules = require(joyServerModulesPath).default as any[];
    let joyGenComponents = [] as any[];
    for (let i = 0; i < joyServerModules.length; i++) {
      if (joyServerModules[i]["___JOY_GEN_PROVIDERS"]) {
        let components = (joyServerModules[i]["___JOY_GEN_PROVIDERS"] as any[]) || [];
        components.forEach((component) => {
          const { mount, module } = component;
          if (mount) {
            joyGenComponents.push({ mount, module } as MountModule);
          } else {
            joyGenComponents.push(module);
          }
        });
        break;
      }
    }

    await this.loadModule([...joyGenComponents, ...joyServerModules]);
  }

  public async close(): Promise<void> {
    await this.reactServer?.close();
    await super.close();
  }
}
