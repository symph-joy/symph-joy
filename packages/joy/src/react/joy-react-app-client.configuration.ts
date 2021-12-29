import { ReactRouterClient } from "./router/react-router-client";
import { Configuration } from "@symph/core";
import { BrowserRouter } from "react-router-dom";
import { ReactAppInitManager, ReactApplicationConfiguration } from "@symph/react";
import { ReactFetchClientService } from "./service/react-fetch.client.service";
import { JoyReactAppInitManagerClient } from "./joy-react-app-init-manager-client";

@Configuration({
  imports: {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    __JOY_AUTOGEN: typeof window !== "undefined" ? window.__JOY_AUTOGEN : undefined,
  },
})
export class JoyReactAppClientConfiguration extends ReactApplicationConfiguration {
  @Configuration.Component()
  public reactRouterComponent(): (props: any) => JSX.Element {
    return BrowserRouter;
  }

  @Configuration.Component()
  public reactRouterService: ReactRouterClient;

  @Configuration.Component()
  public joyFetchService: ReactFetchClientService;

  @Configuration.Component()
  public reactAppInitManager: JoyReactAppInitManagerClient;
}
