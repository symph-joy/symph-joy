import { ReactRouterServer } from "./router/react-router-server";
import { Inject, Configuration } from "@symph/core";
import { BrowserRouter, HashRouter, MemoryRouter } from "react-router-dom";
import { StaticRouter } from "react-router-dom/server";
import { IReactRoute, ReactApplicationConfiguration } from "@symph/react";
import { ReactFetchServerService } from "./service/react-fetch-server.service";
import path from "path";
import { REACT_OUT_DIR } from "./react-const";
import { JoyAppConfig } from "../joy-server/server/joy-app-config";

@Configuration()
export class JoyReactAppServerConfiguration extends ReactApplicationConfiguration {
  @Configuration.Component()
  public reactRouterComponent(): typeof StaticRouter | typeof BrowserRouter | typeof MemoryRouter | typeof HashRouter {
    return StaticRouter;
  }

  @Configuration.Component()
  public reactRouter: ReactRouterServer;

  @Configuration.Component()
  public joyReactAutoGenModules(joyAppConfig: JoyAppConfig): Record<string, unknown>[] {
    const distDir = joyAppConfig.resolveAppDir(joyAppConfig.distDir);
    const genServerModulesPath = path.join(distDir, REACT_OUT_DIR, "server/gen-server-modules.js");
    const modules = require(genServerModulesPath);
    return modules.default || modules;
  }

  @Configuration.Component()
  public joyReactAutoGenRoutes(@Inject("joyReactAutoGenModules") genModules: Record<string, unknown>[]): IReactRoute[] {
    for (const genModule of genModules) {
      if (genModule.joyReactAutoGenRoutes) {
        return genModule.joyReactAutoGenRoutes as any;
      }
    }
    return [];
  }

  @Configuration.Component()
  public joyFetchService: ReactFetchServerService;
}
