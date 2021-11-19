import { Configuration } from "@symph/core";
import { BuildDevConfig } from "../server/build-dev-config";
import { EmitSrcService } from "./webpack/plugins/emit-src-plugin/emit-src-service";
import { FileGenerator } from "./file-generator";
import { FileScanner } from "./scanner/file-scanner";
import { JoyReactRouterPlugin } from "../react/router/joy-react-router-plugin";
import { JoyPrerenderService } from "./prerender/joy-prerender.service";
import { JoyAppProvidersExplorerService } from "../joy-server/server/joy-app-providers-explorer.service";
import { JoyImportService } from "../server/joy-import.service";
import { GlobalCssPlugin } from "../plugin/global-css-plugin";
import { ApiSrcEntryGenerator } from "./api-src-entry-generator";
import { BuildConfig } from "./build-config";

@Configuration()
export class BuildCommonConfiguration {
  @Configuration.Provider()
  public buildConfig: BuildConfig;

  @Configuration.Provider()
  public apiSrcEntryGenerator: ApiSrcEntryGenerator;

  @Configuration.Provider()
  public emitSrcService: EmitSrcService;

  @Configuration.Provider()
  public fileGenerator: FileGenerator;

  @Configuration.Provider()
  public fileScanner: FileScanner;

  @Configuration.Provider()
  public joyAppProvidersExplorerService: JoyAppProvidersExplorerService;

  @Configuration.Provider()
  public joyReactRouterPlugin: JoyReactRouterPlugin;

  @Configuration.Provider()
  public joyPrerenderService: JoyPrerenderService;

  @Configuration.Provider()
  public joyImportService: JoyImportService;

  // @Configuration.Provider()
  // public buildService: JoyBuildService;

  // feature serviers
  @Configuration.Provider()
  public globalCssPlugin: GlobalCssPlugin;
}
