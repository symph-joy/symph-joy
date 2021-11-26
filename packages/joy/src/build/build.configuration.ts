import { Configuration } from "@symph/core";
import { JoyBuildService } from "./joy-build.service";
import { BuildCommonConfiguration } from "./build-common.configuration";

@Configuration()
export class BuildConfiguration extends BuildCommonConfiguration {
  @Configuration.Provider()
  public buildService: JoyBuildService;
}
