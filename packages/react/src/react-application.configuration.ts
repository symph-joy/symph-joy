import { StaticRouter, BrowserRouter, HashRouter, MemoryRouter } from "react-router-dom";
import { ReactRouter } from "./router/react-router";
import { Configuration } from "@symph/core";
import { ReactAppInitManager } from "./react-app-init-manager";
import { MountService } from "./mount/mount.service";
import { ReactApplicationConfig } from "./react-application-config";
import { ConfigConfiguration } from "@symph/config";

@Configuration()
export class ReactApplicationConfiguration {
  @Configuration.Component()
  public configConfiguration: ConfigConfiguration;

  @Configuration.Component()
  public reactApplicationConfig: ReactApplicationConfig;

  @Configuration.Component()
  public reactRouterComponent(): typeof StaticRouter | typeof BrowserRouter | typeof MemoryRouter | typeof HashRouter {
    return MemoryRouter;
  }

  @Configuration.Component()
  public reactRouter: ReactRouter;

  @Configuration.Component()
  public mountService: MountService;

  @Configuration.Component()
  public reactAppInitManager: ReactAppInitManager;
}
