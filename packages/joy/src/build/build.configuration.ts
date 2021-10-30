import { Configuration } from "@symph/core";
import { BuildDevConfig } from "../server/build-dev-config";
import { EmitSrcService } from "./webpack/plugins/emit-src-plugin/emit-src-service";
import { FileGenerator } from "./file-generator";
import { FileScanner } from "./scanner/file-scanner";
import { JoyReactRouterPlugin } from "../react/router/joy-react-router-plugin";
import { JoyBuildService } from "./joy-build.service";
import { JoyPrerenderService } from "./prerender/joy-prerender.service";
import { JoyAppProvidersExplorerService } from "../joy-server/server/joy-app-providers-explorer.service";
import { JoyImportService } from "../server/joy-import.service";

@Configuration()
export class BuildConfiguration {
  // ====== imports

  // @Configuration.Provider()
  // public joyReactBuildConfiguration: JoyReactBuildConfiguration;

  // ====== providers
  // @Configuration.Provider()
  // public joyAppConfig: JoyAppConfig

  @Configuration.Provider()
  public buildConfig: BuildDevConfig;

  @Configuration.Provider()
  public emitSrcService: EmitSrcService;

  @Configuration.Provider()
  public fileGenerator: FileGenerator;

  @Configuration.Provider()
  public fileScanner: FileScanner;

  @Configuration.Provider()
  public joyAppProvidersExplorerService: JoyAppProvidersExplorerService;

  // @Configuration.Provider()
  // public routerPlugin: RouterPlugin;

  @Configuration.Provider()
  public joyReactRouterPlugin: JoyReactRouterPlugin;

  // @Configuration.Provider()
  // public joyExportAppService: JoyExportAppService;

  @Configuration.Provider()
  public joyPrerenderService: JoyPrerenderService;

  @Configuration.Provider()
  public joyImportService: JoyImportService;

  @Configuration.Provider()
  public buildService: JoyBuildService;
}
