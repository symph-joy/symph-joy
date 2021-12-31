import { JoyAppConfig } from "../joy-server/server/joy-app-config";
import { IncomingMessage, ServerResponse } from "http";
import { encode, ParsedUrlQuery } from "querystring";
import { ReactApplicationContext, ReactRouterService } from "@symph/react";
import { Component, ApplicationContainer, EntryType, TComponent } from "@symph/core";
import { JoyReactAppServerConfiguration } from "./joy-react-app-server.configuration";
import { JoyReactApplicationContext } from "./joy-react-application-context";

@Component()
export class ReactContextFactory {
  constructor(private joyAppConfig: JoyAppConfig) {}

  protected getJoyReactAppServerConfig(): typeof JoyReactAppServerConfiguration {
    return JoyReactAppServerConfiguration;
  }

  public async getReactAppContext(
    req: IncomingMessage,
    res: ServerResponse,
    pathname: string,
    query: ParsedUrlQuery
  ): Promise<ReactApplicationContext> {
    const reactApplicationContext = new JoyReactApplicationContext(this.getJoyReactAppServerConfig());
    this.setInitComponent(reactApplicationContext.container, req, res, pathname, query);
    await reactApplicationContext.init();

    const reactRouter = reactApplicationContext.getSync(ReactRouterService);
    reactRouter.setCurrentLocation({
      pathname,
      search: encode(query),
      state: "",
      hash: "",
      key: "",
    }); //todo 完善路由信息

    return reactApplicationContext;
  }

  protected setInitComponent(
    container: ApplicationContainer,
    req: IncomingMessage,
    res: ServerResponse,
    pathname: string,
    query: ParsedUrlQuery
  ): void {
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
      // {
      //   name: "joySSRRequest",
      //   type: IncomingMessage,
      //   useValue: req,
      // },
      // {
      //   name: "joySSRResponse",
      //   type: ServerResponse,
      //   useValue: res,
      // },
    ];
    container.addProviders(components);
  }
}
