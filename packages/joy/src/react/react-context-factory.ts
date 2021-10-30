import { JoyAppConfig } from "../joy-server/server/joy-app-config";
import { IncomingMessage, ServerResponse } from "http";
import { encode, ParsedUrlQuery } from "querystring";
import { ApplicationConfig, ReactApplicationContext, ReactRouter } from "@symph/react";
import { Component, CoreContainer } from "@symph/core";
import { JoyReactAppServerConfiguration } from "./joy-react-app-server.configuration";
import { JoyReactApplicationContext } from "./joy-react-application-context";

@Component()
export class ReactContextFactory {
  constructor(private joyAppConfig: JoyAppConfig) {}

  protected getJoyReactAppServerConfig(): typeof JoyReactAppServerConfiguration {
    return JoyReactAppServerConfiguration;
  }

  public async getReactAppContext(req: IncomingMessage, res: ServerResponse, pathname: string, query: ParsedUrlQuery): Promise<ReactApplicationContext> {
    const applicationConfig = new ApplicationConfig();
    const joyContainer = new CoreContainer();
    this.setInitComponent(joyContainer, req, res, pathname, query);
    const reactApplicationContext = new JoyReactApplicationContext(this.getJoyReactAppServerConfig(), applicationConfig, joyContainer);
    await reactApplicationContext.init();

    const reactRouter = reactApplicationContext.syncGet(ReactRouter);

    reactRouter.setCurrentLocation({
      pathname,
      search: encode(query),
      state: "",
      hash: "",
      key: "",
    }); //todo 完善路由信息

    return reactApplicationContext;
  }

  protected setInitComponent(container: CoreContainer, req: IncomingMessage, res: ServerResponse, pathname: string, query: ParsedUrlQuery): void {
    const components = [
      {
        name: "joyAppConfig",
        type: JoyAppConfig,
        useValue: this.joyAppConfig,
      },
      // StaticRouter props
      {
        name: "reactRouterProps",
        type: Object,
        useValue: { location: pathname },
      },
    ];
    container.addProviders(components);
  }
}
