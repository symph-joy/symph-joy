import { Configuration } from "@symph/core";
import { BuildConfiguration } from "../build/build.configuration";
import { JoyExportConfiguration } from "./joy-export.configuration";

@Configuration()
export class JoyBuildConfiguration extends JoyExportConfiguration {
  @Configuration.Provider()
  joyBuildConfiguration: BuildConfiguration;
}
