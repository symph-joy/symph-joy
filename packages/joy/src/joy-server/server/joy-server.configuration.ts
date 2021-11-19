import { Configuration } from "@symph/core";
import { JoyAppConfig } from "./joy-app-config";
import { ServerConfiguration } from "@symph/server/dist/server.configuration";
import { JoyConfigConfiguration } from "../../joy-config.configuration";
import { BuildConfig } from "../../build/build-config";

@Configuration()
export class JoyServerConfiguration extends ServerConfiguration {
  @Configuration.Provider()
  public configConfiguration: JoyConfigConfiguration;

  @Configuration.Provider()
  applicationConfig: JoyAppConfig;

  @Configuration.Provider()
  public buildConfig: BuildConfig;
}
