import { Configuration } from "@symph/core";
import HotReloader from "./hot-reloader";
import { JoyApiDevServer } from "./joy-api-dev-server";
import { JoyReactDevServer } from "./joy-react-dev-server";
import { JoyDevServer } from "./joy-dev-server";
import { JoyReactDevConfiguration } from "../react/joy-react-dev.configuration";
import { JoyBuildDevConfiguration } from "../build/joy-build-dev.configuration";
import { JoyServerConfiguration } from "../joy-server/server/joy-server.configuration";

@Configuration()
export class JoyServerDevConfiguration extends JoyServerConfiguration {
  // // ====== imports
  //
  @Configuration.Provider()
  joyBuildConfiguration: JoyBuildDevConfiguration;

  @Configuration.Provider()
  joyReactConfiguration: JoyReactDevConfiguration;

  // ====== providers

  // @Configuration.Provider()
  // public serverConfig: ServerConfigDev;

  @Configuration.Provider()
  public hotReloader: HotReloader;

  @Configuration.Provider()
  public joyApiServer: JoyApiDevServer;

  // @Configuration.Provider()
  // public joyReactServer: JoyReactDevServer;

  @Configuration.Provider()
  public joyServer: JoyDevServer;
}
