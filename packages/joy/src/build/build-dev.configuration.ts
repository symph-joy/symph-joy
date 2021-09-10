import { Configuration } from "@symph/core";
import { BuildDevConfig } from "../server/build-dev-config";
import { BuildConfiguration } from "./build.configuration";
import { JoyReactRouterPluginDev } from "../react/router/joy-react-router-plugin-dev";

@Configuration()
export class BuildDevConfiguration extends BuildConfiguration {
  // ====== imports

  // @Configuration.Provider()
  // public joyReactBuildConfiguration: JoyReactBuildDevConfiguration;

  // ====== providers
  // @Configuration.Provider()
  // public joyAppConfig: JoyAppConfig

  @Configuration.Provider()
  public buildConfig: BuildDevConfig;

  @Configuration.Provider()
  public joyReactRouterPlugin: JoyReactRouterPluginDev;
}
