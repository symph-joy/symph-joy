import { Configuration } from "@symph/core";
import { JoyReactConfiguration } from "./joy-react.configuration";
import { JoyReactRouterPluginDev } from "./router/joy-react-router-plugin-dev";
import { ReactContextFactoryDev } from "../server/react-context-factory-dev";
import { JoyReactBuildConfiguration } from "./joy-react-build.configuration";
import { BuildDevConfiguration } from "../build/build-dev.configuration";
import { JoyReactDevServer } from "../server/joy-react-dev-server";

/**
 * 配置Joy中分析和编译React相关模块
 */
@Configuration()
export class JoyReactDevConfiguration {
  // @Configuration.Component()
  // public joyBuildConfiguration: JoyBuildDevConfiguration;

  // @Configuration.Component()
  // public joyReactRouter: JoyReactRouterPluginDev;

  @Configuration.Component()
  public reactContextFactory: ReactContextFactoryDev;

  @Configuration.Component()
  public joyReactServer: JoyReactDevServer;
}
