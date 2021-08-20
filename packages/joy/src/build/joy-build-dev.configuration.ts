import { Configuration } from "@symph/core";
import { BuildDevConfig } from "../server/build-dev-config";
import { EmitSrcService } from "./webpack/plugins/emit-src-plugin/emit-src-service";
import { FileGenerator } from "../plugin/file-generator";
import { FileScanner } from "../joy-server/server/scanner/file-scanner";
import { JoyBuildService } from "./joy-build.service";
import { JoyPrerenderService } from "./prerender/joy-prerender.service";
import { JoyExportAppService } from "../export/joy-export-app.service";
import { JoyAppProvidersExplorerService } from "../joy-server/server/joy-app-providers-explorer.service";
import { JoyImportService } from "../server/joy-import.service";
import { JoyAppConfig } from "../joy-server/server/joy-app-config";
import { JoyReactDevConfiguration } from "../react/joy-react-dev.configuration";
import { JoyBuildConfiguration } from "./joy-build.configuration";

@Configuration()
export class JoyBuildDevConfiguration extends JoyBuildConfiguration {
  // ====== imports

  // @Configuration.Provider()
  // public joyReactBuildConfiguration: JoyReactDevConfiguration;

  // ====== providers
  // @Configuration.Provider()
  // public joyAppConfig: JoyAppConfig

  @Configuration.Provider()
  public buildConfig: BuildDevConfig;
}
