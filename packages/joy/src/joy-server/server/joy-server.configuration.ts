import { Configuration } from "@symph/core";
import { JoyAppConfig } from "./joy-app-config";
import { ServerConfiguration } from "@symph/server/dist/server.configuration";
import { JoyConfigConfiguration } from "./joy-config.configuration";
import { BuildConfig } from "../../build/build-config";
import { JoyImageOptimizeService } from "./image/joy-image-optimize.service";

@Configuration()
export class JoyServerConfiguration extends ServerConfiguration {
  @Configuration.Component()
  public configConfiguration: JoyConfigConfiguration;

  @Configuration.Component()
  applicationConfig: JoyAppConfig;

  @Configuration.Component()
  joyImageOptimizeService: JoyImageOptimizeService;

  @Configuration.Component()
  public buildConfig: BuildConfig;
}
