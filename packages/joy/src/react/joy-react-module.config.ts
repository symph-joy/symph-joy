import { Configuration } from "@symph/core";
import { ReactRouterServer } from "./router/react-router-server";
import { ReactRouter } from "@symph/react";
import { ReactContextFactory } from "./react-context-factory";
import { JoyReactConfig } from "./joy-react-config";
import { JoyReactRouterPlugin } from "./router/joy-react-router-plugin";

@Configuration()
export class JoyReactModuleConfig {
  @Configuration.Provider()
  public joyReactConfig: JoyReactConfig;

  @Configuration.Provider({ type: JoyReactRouterPlugin })
  public joyReactRouter: ReactRouter;

  @Configuration.Provider()
  public reactContextFactory: ReactContextFactory;
}
