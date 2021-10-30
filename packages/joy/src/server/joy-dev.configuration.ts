import { Configuration } from "@symph/core";
import HotReloader from "./hot-reloader";
import { JoyDevServer } from "./joy-dev-server";
import { JoyReactDevConfiguration } from "../react/joy-react-dev.configuration";
import { BuildDevConfiguration } from "../build/build-dev.configuration";
import { JoyConfigConfiguration } from "../joy-config.configuration";
import { JoyBuildConfiguration } from "./joy-build.configuration";

@Configuration()
export class JoyDevConfiguration extends JoyBuildConfiguration {
  // // ====== imports
  @Configuration.Provider()
  public configConfiguration: JoyConfigConfiguration;

  @Configuration.Provider()
  buildConfiguration: BuildDevConfiguration;

  @Configuration.Provider()
  joyReactConfiguration: JoyReactDevConfiguration;

  // ====== providers

  @Configuration.Provider()
  public hotReloader: HotReloader;

  @Configuration.Provider()
  public joyServer: JoyDevServer;
}
