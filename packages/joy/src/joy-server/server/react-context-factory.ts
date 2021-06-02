import { JoyAppConfig } from "./joy-config/joy-app-config";
import { IncomingMessage, ServerResponse } from "http";
import { ParsedUrlQuery } from "querystring";
import {
  ApplicationConfig,
  ReactApplicationContext,
  ReactRouter,
} from "@symph/react";
import { EntryType, Injectable, JoyContainer } from "@symph/core";
import { JoyReactAppServerConfig } from "../lib/joy-react-app-server-config";
import { getServerAutoGenerateModules } from "../../plugin/getServerGenModules";

@Injectable()
export class ReactContextFactory {
  constructor(protected joyAppConfig: JoyAppConfig) {}

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
  // }

  protected getReactAppProviderConfig(): EntryType[] {
    return [JoyReactAppServerConfig];
  }

  public async getReactAppContext(
    req: IncomingMessage,
    res: ServerResponse,
    pathname: string,
    query: ParsedUrlQuery
  ): Promise<ReactApplicationContext> {
    const applicationConfig = new ApplicationConfig();
    const joyContainer = new JoyContainer();
    const reactApplicationContext = new ReactApplicationContext(
      {},
      applicationConfig,
      joyContainer
    );
    await reactApplicationContext.init();
    const autoGenModules = await getServerAutoGenerateModules(
      this.joyAppConfig.resolveAppDir(this.joyAppConfig.distDir)
    );
    await reactApplicationContext.loadModule([
      ...autoGenModules,
      { reactRouterProps: { type: Object, useValue: { location: pathname } } }, // StaticRouter props
      ...this.getReactAppProviderConfig(),
    ]);

    const reactRouter = reactApplicationContext.syncGetProvider(ReactRouter);
    reactRouter.setCurrentLocation({
      pathname,
      search: "",
      state: "",
      hash: "",
      key: "",
    }); //todo 完善路由信息

    return reactApplicationContext;
  }
}
