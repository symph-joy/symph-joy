import { Configuration } from "@symph/core";
import { EmitSrcService } from "./webpack/plugins/emit-src-plugin/emit-src-service";
import { FileGenerator } from "./file-generator";
import { FileScanner } from "./scanner/file-scanner";
import { JoyReactRouterPlugin } from "../react/router/joy-react-router-plugin";
import { JoyPrerenderService } from "./prerender/joy-prerender.service";
import { JoyImportService } from "../server/joy-import.service";
import { GlobalCssPlugin } from "../plugin/global-css-plugin";
import { ApiSrcEntryGenerator } from "./api-src-entry-generator";
import { SrcBuilder } from "./src-builder";
import { BuildConfig } from "./build-config";

@Configuration()
export class BuildCommonConfiguration {
  @Configuration.Component()
  public buildConfig: BuildConfig;

  @Configuration.Component()
  public apiSrcEntryGenerator: ApiSrcEntryGenerator;

  @Configuration.Component()
  public srcBuilder: SrcBuilder;

  @Configuration.Component()
  public emitSrcService: EmitSrcService;

  @Configuration.Component()
  public fileGenerator: FileGenerator;

  @Configuration.Component()
  public fileScanner: FileScanner;

  @Configuration.Component()
  public joyReactRouterPlugin: JoyReactRouterPlugin;

  @Configuration.Component()
  public joyPrerenderService: JoyPrerenderService;

  @Configuration.Component()
  public joyImportService: JoyImportService;

  // @Configuration.Component()
  // public buildService: JoyBuildService;

  // feature serviers
  @Configuration.Component()
  public globalCssPlugin: GlobalCssPlugin;
}
