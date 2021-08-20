import { Configuration } from "@symph/core";
import { JoyReactConfiguration } from "./joy-react.configuration";
import { JoyReactRouterPluginDev } from "./router/joy-react-router-plugin-dev";
import { ReactContextFactoryDev } from "../server/react-context-factory-dev";
import { JoyReactBuildConfiguration } from "./joy-react-build.configuration";
import { JoyBuildDevConfiguration } from "../build/joy-build-dev.configuration";

/**
 * 配置Joy中分析和编译React相关模块
 */
@Configuration()
export class JoyReactDevConfiguration extends JoyReactBuildConfiguration {
  @Configuration.Provider()
  public joyBuildConfiguration: JoyBuildDevConfiguration;

  @Configuration.Provider()
  public joyReactRouter: JoyReactRouterPluginDev;

  @Configuration.Provider()
  public reactContextFactory: ReactContextFactoryDev;
}
