import { Configuration, CoreContext, Inject } from "@symph/core";
import { BuildDevConfig } from "../server/build-dev-config";
import { EmitSrcService } from "./webpack/plugins/emit-src-plugin/emit-src-service";
import { FileGenerator } from "../plugin/file-generator";
import { FileScanner } from "../next-server/server/scanner/file-scanner";
import { RouterPlugin } from "../router/router-plugin";
import { JoyReactRouterPlugin } from "../router/joy-react-router-plugin";
import { JoyBuildService } from "./joy-build.service";
import { JoyPrerenderService } from "./prerender/joy-prerender.service";
import { JoyExportAppService } from "../export/joy-export-app.service";

@Configuration()
export class JoyBuildConfig {
  @Configuration.Provider()
  public buildConfig: BuildDevConfig;

  @Configuration.Provider()
  public emitSrcService: EmitSrcService;

  @Configuration.Provider()
  public fileGenerator: FileGenerator;

  @Configuration.Provider()
  public fileScanner: FileScanner;

  @Configuration.Provider()
  public routerPlugin: RouterPlugin;

  @Configuration.Provider()
  public joyReactRouter: JoyReactRouterPlugin;

  @Configuration.Provider()
  public buildService: JoyBuildService;

  @Configuration.Provider()
  public joyExportAppService: JoyExportAppService;

  @Configuration.Provider()
  public joyPrerenderService: JoyPrerenderService;
}
