import {
  StaticRouter,
  BrowserRouter,
  HashRouter,
  MemoryRouter,
} from "react-router-dom";
import { ReactRouter } from "./router/react-router";
import { Configuration } from "@symph/core";

@Configuration()
export class ReactApplicationConfig {
  @Configuration.Provider({
    useValue: MemoryRouter,
    type: Object,
  })
  public reactRouterComponent:
    | typeof StaticRouter
    | typeof BrowserRouter
    | typeof MemoryRouter
    | typeof HashRouter;

  @Configuration.Provider()
  public reactRouter: ReactRouter;
}
