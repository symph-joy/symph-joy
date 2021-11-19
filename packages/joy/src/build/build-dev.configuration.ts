import { Configuration } from "@symph/core";
import { BuildDevConfig } from "../server/build-dev-config";
import { JoyReactRouterPluginDev } from "../react/router/joy-react-router-plugin-dev";
import HotReloader from "../server/hot-reloader";
import { JoyConfigConfiguration } from "../joy-config.configuration";
import { JoyAppConfig } from "../joy-server/server/joy-app-config";
import { BuildCommonConfiguration } from "./build-common.configuration";

/**
 * 后续服务容器启动时，将沿用父容器（即当前编译容器）的这些组件。
 */
@Configuration()
export class BuildDevConfiguration extends BuildCommonConfiguration {
  @Configuration.Provider()
  public configConfiguration: JoyConfigConfiguration;

  @Configuration.Provider()
  public joyAppConfig: JoyAppConfig;

  @Configuration.Provider()
  public hotReloader: HotReloader;

  @Configuration.Provider()
  public buildConfig: BuildDevConfig;

  @Configuration.Provider()
  public joyReactRouterPlugin: JoyReactRouterPluginDev;
}
