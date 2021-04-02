import { Configuration, CoreContext, Inject } from "@symph/core";
import { BuildDevConfig } from "../server/build-dev-config";
import { EmitSrcService } from "./webpack/plugins/emit-src-plugin/emit-src-service";
import { FileGenerator } from "../plugin/file-generator";
import { FileScanner } from "../next-server/server/scanner/file-scanner";
import { RouterPlugin } from "../router/router-plugin";
import { JoyReactRouter } from "../router/joy-react-router";
import { JoyBuildService } from "./joy-build.service";

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
  public joyReactRouter: JoyReactRouter;

  @Configuration.Provider()
  public buildService: JoyBuildService;
}
