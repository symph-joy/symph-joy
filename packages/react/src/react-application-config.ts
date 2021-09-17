import { StaticRouter, BrowserRouter, HashRouter, MemoryRouter } from "react-router-dom";
import { ReactRouter } from "./router/react-router";
import { Configuration } from "@symph/core";
import { ReactAppInitManager } from "./react-app-init-manager";

@Configuration()
export class ReactApplicationConfig {
  @Configuration.Provider({
    useValue: MemoryRouter,
    type: Object,
  })
  public reactRouterComponent: typeof StaticRouter | typeof BrowserRouter | typeof MemoryRouter | typeof HashRouter;

  @Configuration.Provider()
  public reactRouter: ReactRouter;

  @Configuration.Provider()
  public reactAppInitManager: ReactAppInitManager;
}
