import { Configuration } from "@symph/core";
import { JoyAppConfig } from "./joy-app-config";
import { JoyApiServer } from "./joy-api-server";
import { JoyServer } from "./joy-server";
import { ServerConfiguration } from "@symph/server/dist/server.configuration";

@Configuration()
export class JoyServerConfiguration extends ServerConfiguration {
  // ====== providers

  @Configuration.Provider()
  applicationConfig: JoyAppConfig;

  @Configuration.Provider()
  public joyServer: JoyServer;
}
