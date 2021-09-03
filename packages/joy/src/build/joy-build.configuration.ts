import { Configuration, CoreContext, Autowire } from "@symph/core";
import { BuildDevConfig } from "../server/build-dev-config";
import { EmitSrcService } from "./webpack/plugins/emit-src-plugin/emit-src-service";
import { FileGenerator } from "../plugin/file-generator";
import { FileScanner } from "../joy-server/server/scanner/file-scanner";
import { RouterPlugin } from "../react/router/router-plugin";
import { JoyReactRouterPlugin } from "../react/router/joy-react-router-plugin";
import { JoyBuildService } from "./joy-build.service";
import { JoyPrerenderService } from "./prerender/joy-prerender.service";
import { JoyExportAppService } from "../export/joy-export-app.service";
import { JoyAppProvidersExplorerService } from "../joy-server/server/joy-app-providers-explorer.service";
import { JoyImportService } from "../server/joy-import.service";
import { JoyReactBuildConfiguration } from "../react/joy-react-build.configuration";
import { JoyAppConfig } from "../joy-server/server/joy-app-config";

@Configuration()
export class JoyBuildConfiguration {
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

  @Configuration.Provider()
  public joyExportAppService: JoyExportAppService;

  @Configuration.Provider()
  public joyPrerenderService: JoyPrerenderService;

  @Configuration.Provider()
  public joyImportService: JoyImportService;

  @Configuration.Provider()
  public buildService: JoyBuildService;
}
