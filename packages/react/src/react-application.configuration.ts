import { StaticRouter, BrowserRouter, HashRouter, MemoryRouter } from "react-router-dom";
import { ReactRouter } from "./router/react-router";
import { Configuration } from "@symph/core";
import { ReactAppInitManager } from "./react-app-init-manager";
import { MountService } from "./mount/mount.service";
import { ReactApplicationConfig } from "./react-application-config";
import { ConfigConfiguration } from "@symph/config";

@Configuration()
export class ReactApplicationConfiguration {
  @Configuration.Provider()
  public configConfiguration: ConfigConfiguration;

  @Configuration.Provider()
  public reactApplicationConfig: ReactApplicationConfig;

  @Configuration.Provider()
  public reactRouterComponent(): typeof StaticRouter | typeof BrowserRouter | typeof MemoryRouter | typeof HashRouter {
    return MemoryRouter;
  }

  @Configuration.Provider()
  public reactRouter: ReactRouter;

  @Configuration.Provider()
  public mountService: MountService;

  @Configuration.Provider()
  public reactAppInitManager: ReactAppInitManager;
}
