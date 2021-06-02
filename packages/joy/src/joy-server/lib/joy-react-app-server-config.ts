import { ReactRouterServer } from "../../router/react-router-server";
import { Configuration } from "@symph/core";
import {
  BrowserRouter,
  HashRouter,
  MemoryRouter,
  StaticRouter,
} from "react-router-dom";
import { ReactApplicationConfig, ReactRouter } from "@symph/react";

@Configuration({ imports: [] })
export class JoyReactAppServerConfig extends ReactApplicationConfig {
  @Configuration.Provider({
    useValue: StaticRouter,
    type: Object,
  })
  public reactRouterComponent:
    | typeof StaticRouter
    | typeof BrowserRouter
    | typeof MemoryRouter
    | typeof HashRouter;

  @Configuration.Provider({ type: ReactRouterServer })
  public reactRouter: ReactRouterServer;
}
