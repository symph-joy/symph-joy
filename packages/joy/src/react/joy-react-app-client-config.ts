import { ReactRouterClient } from "./router/react-router-client";
import { Configuration } from "@symph/core";
import { BrowserRouter, HashRouter, MemoryRouter, StaticRouter } from "react-router-dom";
import { ReactApplicationConfig } from "@symph/react";
import { JoyFetchService } from "./service/joy-fetch.service";

@Configuration({
  imports: {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    __JOY_AUTOGEN: typeof window !== "undefined" ? window.__JOY_AUTOGEN : undefined,
  },
})
export class JoyReactAppClientConfig extends ReactApplicationConfig {
  @Configuration.Provider({
    useValue: BrowserRouter,
    type: Object,
  })
  public reactRouterComponent: typeof StaticRouter | typeof BrowserRouter | typeof MemoryRouter | typeof HashRouter;

  @Configuration.Provider()
  public reactRouter: ReactRouterClient;

  @Configuration.Provider()
  public joyFetchService: JoyFetchService;
}
