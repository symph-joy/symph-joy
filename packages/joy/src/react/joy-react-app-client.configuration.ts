import { ReactRouterClient } from "./router/react-router-client";
import { Configuration } from "@symph/core";
import { BrowserRouter } from "react-router-dom";
import { ReactApplicationConfiguration } from "@symph/react";
import { ReactFetchClientService } from "./service/react-fetch.client.service";
import { JoyReactAppInitManagerClient } from "./joy-react-app-init-manager-client";
import { JoyReactApplicationContext } from "./joy-react-application-context";

@Configuration()
export class JoyReactAppClientConfiguration extends ReactApplicationConfiguration {
  constructor(private context: JoyReactApplicationContext) {
    super();
    // @ts-ignore
    const modules = typeof window !== "undefined" ? window.__JOY_AUTOGEN : undefined;
    this.context.registerPreGenModule(modules.default || modules);
  }

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
