import { Configuration } from "@symph/core";
import { BuildDevConfig } from "../server/build-dev-config";
import { JoyReactRouterPluginDev } from "../react/router/joy-react-router-plugin-dev";
import HotReloader from "../server/hot-reloader";
import { JoyConfigConfiguration } from "../joy-server/server/joy-config.configuration";
import { JoyAppConfig } from "../joy-server/server/joy-app-config";
import { BuildCommonConfiguration } from "./build-common.configuration";

/**
 * 后续服务容器启动时，将沿用父容器（即当前编译容器）的这些组件。
 */
@Configuration()
export class BuildDevConfiguration extends BuildCommonConfiguration {
  @Configuration.Component()
  public configConfiguration: JoyConfigConfiguration;

  @Configuration.Component()
  public joyAppConfig: JoyAppConfig;

  @Configuration.Component()
  public hotReloader: HotReloader;

  @Configuration.Component()
  public buildConfig: BuildDevConfig;

  @Configuration.Component()
  public joyReactRouterPlugin: JoyReactRouterPluginDev;
}
