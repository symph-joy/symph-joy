import {
  Injectable,
  InstanceWrapper,
  isClassProvider,
  Provider,
  Tap,
} from "@symph/core";
import { IReactRoute, ReactRouter } from "@symph/react";
import { NextDevServer } from "../server/next-dev-server";
import { IncomingMessage, ServerResponse } from "http";
import { ParsedUrlQuery } from "querystring";
import { FileScanner } from "../next-server/server/scanner/file-scanner";
import { readFileSync } from "fs";
import { join } from "path";

import { FileGenerator } from "../plugin/file-generator";
import { handlebars } from "../lib/handlebars";

export interface IJoyReactRouteBuild extends IReactRoute {
  filePath?: string;
}

@Injectable()
export class JoyReactRouter<
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

  protected extendRoute(route: IReactRoute): T {
    let filePath: string | undefined = undefined;
    if (route.providerId) {
      const srcFilePath = this.fileScanner.getSourceFileByProviderId(
        route.providerId
      );
      if (srcFilePath) {
        // is from file scanner
        // const relativePath = this.config.getAppRelativeDir(srcFilePath)
        const relativePath = srcFilePath; // todo 切换为，使用相对于项目根目录的相对路径
        filePath = relativePath;
      }
    }

    const buildRoute: IJoyReactRouteBuild = {
      ...route,
      filePath,
    };
    return this.extendBuildRoute(buildRoute);
  }

  protected extendBuildRoute(route: IJoyReactRouteBuild): T {
    return route as T;
  }

  // private plainRoutesTree(routes: IJoyReactRouteBuild[]): IJoyReactRouteBuild[] {
  //   const plainRoutes: any[] = [];
  //   const getFromRoutes = (rootRoutes: IReactRoute[]) => {
  //     if (!rootRoutes?.length) {
  //       return;
  //     }
  //     rootRoutes.forEach((route) => {
  //       plainRoutes.push(route);
  //       if (route.routes?.length) {
  //         getFromRoutes(route.routes);
  //       }
  //     });
  //   };
  //   getFromRoutes(routes);
  //   return plainRoutes;
  // }
  //
  // public async ensurePath(pathname: string) {
  //   const matchedRoutes = this.getMatchedRoutes(pathname);
  //   if (!matchedRoutes) {
  //     return;
  //   }
  //
  //   const usedRoutes = this.plainRoutesTree([matchedRoutes]);
  //   const waitingRoutes: IReactRouteDev[] = [];
  //   usedRoutes.forEach((route) => {
  //     waitingRoutes.push(route);
  //     if (!route.isAdd) {
  //       route.isAdd = true;
  //     }
  //   });
  //   if (waitingRoutes.length == 0) {
  //     return;
  //   }
  //   const routeFiles = waitingRoutes
  //     .map((r) => r.filePath)
  //     .filter(Boolean) as string[];
  //   await this.joyDevServer.ensureModules(routeFiles);
  // }

  // @Tap()
  // async onBeforeRender({
  //   req,
  //   res,
  //   pathname,
  //   query,
  // }: {
  //   req: IncomingMessage;
  //   res: ServerResponse;
  //   pathname: string;
  //   query: ParsedUrlQuery;
  // }): Promise<void> {
  //   await this.ensurePath(pathname);
  // }

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
