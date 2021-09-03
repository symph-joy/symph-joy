import { Configuration } from "@symph/core";
import { JoyReactConfiguration } from "../../react/joy-react.configuration";
import { JoyAppConfig } from "./joy-app-config";
import { JoyReactServer } from "./joy-react-server";
import { JoyApiServer } from "./joy-api-server";
import { JoyServer } from "./joy-server";

@Configuration()
export class JoyServerConfiguration {
  // ====== imports

  @Configuration.Provider()
  joyReactConfiguration: JoyReactConfiguration;

  // ====== providers

  @Configuration.Provider()
  public joyAppConfig: JoyAppConfig;

  // @Configuration.Provider()
  // public serverConfig: ServerConfig;

  // @Configuration.Provider()
  // public joyReactServer: JoyReactServer;

  @Configuration.Provider()
  public joyApiServer: JoyApiServer;

  @Configuration.Provider()
  public joyServer: JoyServer;
}
