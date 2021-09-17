import { JoyAppConfig } from "../joy-server/server/joy-app-config";
import { IncomingMessage, ServerResponse } from "http";
import { ParsedUrlQuery, encode } from "querystring";
import { ApplicationConfig, ReactApplicationContext, ReactRouter } from "@symph/react";
import { EntryType, Component, CoreContainer, Provider } from "@symph/core";
import { JoyReactAppServerConfig } from "./joy-react-app-server-config";
import { JoyReactConfig } from "./joy-react-config";
import path from "path";
import { REACT_OUT_DIR } from "./react-const";
import { JoyFetchServerService } from "./service/joy-fetch-server.service";
import { JoyFetchService } from "./service/joy-fetch.service";

@Component()
export class ReactContextFactory {
  constructor(private joyAppConfig: JoyAppConfig) {}

  // public async getAutoGenerateModules(): Promise<any[]> {
  //   const genServerModulesPath = this.joyAppConfig.resolveAppDir(
  //     this.joyAppConfig.distDir,
  //     "./out/server/gen-server-modules.js"
  //   );
  //   const modules = require(genServerModulesPath);
  //   return modules.default || modules;
  //   // if (await fileExists(genServerModulesPath)){
  //   //   const modules = require(genServerModulesPath)
  //   //   return  modules.default || modules
  //   // } else {
  //   //   return  []
  //   // }
  // }`

  protected getReactAppProviderConfig(): EntryType[] {
    return [JoyReactAppServerConfig];
  }

  public async getReactAppContext(req: IncomingMessage, res: ServerResponse, pathname: string, query: ParsedUrlQuery): Promise<ReactApplicationContext> {
    const applicationConfig = new ApplicationConfig();
    const joyContainer = new CoreContainer();
    const reactApplicationContext = new ReactApplicationContext({}, applicationConfig, joyContainer);
    await reactApplicationContext.init();
    // const autoGenModules = await getServerAutoGenerateModules(this.joyAppConfig.resolveAppDir(this.joyAppConfig.distDir));
    const autoGenModules = this.getServerAutoGenerateModules();
    await reactApplicationContext.loadModule([...autoGenModules, this.getInitService(req, res, pathname, query), ...this.getReactAppProviderConfig()]);

    const reactRouter = reactApplicationContext.syncGet(ReactRouter);

    reactRouter.setCurrentLocation({
      pathname,
      search: encode(query),
      state: "",
      hash: "",
      key: "",
    }); //todo 完善路由信息

    return reactApplicationContext;
  }

  protected getInitService(req: IncomingMessage, res: ServerResponse, pathname: string, query: ParsedUrlQuery): Record<string, Provider> {
    return {
      joyAppConfig: {
        name: "joyAppConfig",
        type: JoyAppConfig,
        useValue: this.joyAppConfig,
      },
      // StaticRouter props
      reactRouterProps: {
        name: "reactRouterProps",
        type: Object,
        useValue: { location: pathname },
      },
      // joyFetchService: {
      //   name: "joyFetchService",
      //   type: JoyFetchProxy,
      //   useClass: JoyFetchProxyServer,
      // },
    };
  }

  getServerAutoGenerateModules(): Record<string, any>[] {
    const distDir = this.joyAppConfig.resolveAppDir(this.joyAppConfig.distDir);
    const genServerModulesPath = path.join(distDir, REACT_OUT_DIR, "server/gen-server-modules.js");
    const modules = require(genServerModulesPath);
    return modules.default || modules;
  }
}
