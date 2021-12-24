import { MemoryRouter } from "react-router";
import { ReactRouterService } from "./router/react-router-service";
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
  public reactRouterComponent(): (props: any) => JSX.Element {
    // public reactRouterComponent(): typeof StaticRouter | typeof BrowserRouter | typeof MemoryRouter | typeof HashRouter {
    return MemoryRouter;
  }

  @Configuration.Component()
  public reactRouterService: ReactRouterService;

  @Configuration.Component()
  public mountService: MountService;

  @Configuration.Component()
  public reactAppInitManager: ReactAppInitManager;
}
