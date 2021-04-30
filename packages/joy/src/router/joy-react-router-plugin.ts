import {
  Injectable,
  InstanceWrapper,
  isClassProvider,
  Provider,
  Tap,
  Type,
} from "@symph/core";
import { IReactRoute, IRouteMeta, ReactRouter } from "@symph/react";
import { NextDevServer } from "../server/next-dev-server";
import { IncomingMessage, ServerResponse } from "http";
import { ParsedUrlQuery } from "querystring";
import { FileScanner } from "../next-server/server/scanner/file-scanner";
import { readFileSync } from "fs";
import { join } from "path";

import { FileGenerator } from "../plugin/file-generator";
import { handlebars } from "../lib/handlebars";

export interface IJoyReactRouteBuild extends IReactRoute {
  staticPathGenerator?: IRouteMeta["staticPathGenerator"];
  srcPath?: string;
}

@Injectable()
export class JoyReactRouterPlugin<
  T extends IJoyReactRouteBuild = IJoyReactRouteBuild
> extends ReactRouter<T> {
  protected routesTemplate = handlebars.compile(
    readFileSync(join(__dirname, "./routes.handlebars"), "utf-8")
  );

  constructor(
    protected fileGenerator: FileGenerator,
    protected fileScanner: FileScanner
  ) {
    super();
  }

  protected fromRouteMeta(
    path: string,
    providerId: string,
    meta: IRouteMeta,
    useClass: Type
  ): T {
    const routeObj = super.fromRouteMeta(path, providerId, meta, useClass);

    let filePath: string | undefined;
    if (providerId) {
      const scanModule = this.fileScanner.getCacheModuleByProviderId(
        providerId
      );
      // is from file scanner
      // const relativePath = this.config.getAppRelativeDir(srcFilePath)
      // todo 切换为，使用相对于项目根目录的相对路径
      filePath = scanModule?.resource;
    }

    if (!filePath) {
      throw new Error(
        `route(path:${path}, providerId:${providerId}) can't found src file. `
      );
    }
    const buildRoute: IJoyReactRouteBuild = {
      ...routeObj,
      srcPath: filePath,
    };
    return this.extendBuildRoute(buildRoute);
  }

  protected extendBuildRoute(route: IJoyReactRouteBuild): T {
    return route as T;
  }

  @Tap()
  protected async onRegisterProviderAfter(
    provider: Provider,
    instanceWrapper: InstanceWrapper
  ) {
    if (!isClassProvider(provider)) {
      return;
    }
    const addedRoutes = this.addRouteProvider(provider);
    if (addedRoutes && addedRoutes.length > 0) {
      console.log(">>>> IReactRouteDev. onRegisterProviderAfter", provider);
    }
  }

  @Tap()
  protected async onReplaceProviderAfter(
    nextProvider: Provider,
    preProvider: Provider
  ) {
    if (!isClassProvider(nextProvider)) {
      return;
    }
    this.replaceRouteProvider(nextProvider, preProvider.id);
    console.log(">>>> IReactRouteDev. onReplaceProviderAfter", nextProvider);
  }

  @Tap()
  protected async onGenerateFiles() {
    console.log(">>>> IReactRouteDev. onGenerateFiles");
    const clientRoutes = this.getRoutes();
    const clientFileContent = this.routesTemplate({ routes: clientRoutes });
    await this.fileGenerator.writeCommonFile("./routes.js", clientFileContent);
  }
}
