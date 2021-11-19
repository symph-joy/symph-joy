import { ReactRouterServer } from "./router/react-router-server";
import { Autowire, Configuration } from "@symph/core";
import { BrowserRouter, HashRouter, MemoryRouter, StaticRouter } from "react-router-dom";
import { IReactRoute, ReactApplicationConfiguration } from "@symph/react";
import { ReactFetchServerService } from "./service/react-fetch-server.service";
import path from "path";
import { REACT_OUT_DIR } from "./react-const";
import { JoyAppConfig } from "../joy-server/server/joy-app-config";

@Configuration()
export class JoyReactAppServerConfiguration extends ReactApplicationConfiguration {
  @Configuration.Provider()
  public reactRouterComponent(): typeof StaticRouter | typeof BrowserRouter | typeof MemoryRouter | typeof HashRouter {
    return StaticRouter;
  }

  @Configuration.Provider()
  public reactRouter: ReactRouterServer;

  @Configuration.Provider()
  public joyReactAutoGenModules(joyAppConfig: JoyAppConfig): Record<string, unknown>[] {
    const distDir = joyAppConfig.resolveAppDir(joyAppConfig.distDir);
    const genServerModulesPath = path.join(distDir, REACT_OUT_DIR, "server/gen-server-modules.js");
    const modules = require(genServerModulesPath);
    return modules.default || modules;
  }

  @Configuration.Provider()
  public joyReactAutoGenRoutes(@Autowire("joyReactAutoGenModules") genModules: Record<string, unknown>[]): IReactRoute[] {
    for (const genModule of genModules) {
      if (genModule.joyReactAutoGenRoutes) {
        return genModule.joyReactAutoGenRoutes as any;
      }
    }
    return [];
  }

  @Configuration.Provider()
  public joyFetchService: ReactFetchServerService;
}
