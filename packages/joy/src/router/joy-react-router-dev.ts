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
import { IJoyReactRouteBuild, JoyReactRouter } from "./joy-react-router";

interface IReactRouteBuildDev extends IJoyReactRouteBuild {
  filePath?: string;
  isAdd?: boolean;
}

@Injectable()
export class JoyReactRouterDev extends JoyReactRouter<IReactRouteBuildDev> {
  protected routesTemplate = handlebars.compile(
    readFileSync(join(__dirname, "./routes.handlebars"), "utf-8")
  );
  constructor(
    protected fileGenerator: FileGenerator,
    protected fileScanner: FileScanner,
    protected joyDevServer: NextDevServer
  ) {
    super(fileGenerator, fileScanner);
  }

  protected extendBuildRoute(route: IJoyReactRouteBuild): IReactRouteBuildDev {
    return {
      ...route,
      isAdd: false,
    };
  }

  protected mergeRouteExtendState(
    to: IReactRouteBuildDev,
    from: IReactRouteBuildDev
  ) {
    to.isAdd = from.isAdd;
  }

  private plainRoutesTree(
    routes: IReactRouteBuildDev[]
  ): IReactRouteBuildDev[] {
    const plainRoutes: any[] = [];
    const getFromRoutes = (rootRoutes: IReactRoute[]) => {
      if (!rootRoutes?.length) {
        return;
      }
      rootRoutes.forEach((route) => {
        plainRoutes.push(route);
        if (route.routes?.length) {
          getFromRoutes(route.routes);
        }
      });
    };
    getFromRoutes(routes);
    return plainRoutes;
  }

  public async ensurePath(pathname: string) {
    const matchedRoutes = this.getMatchedRoutes(pathname);
    if (!matchedRoutes) {
      return;
    }

    const usedRoutes = this.plainRoutesTree([matchedRoutes]);
    const waitingRoutes: IReactRouteBuildDev[] = [];
    usedRoutes.forEach((route) => {
      waitingRoutes.push(route);
      if (!route.isAdd) {
        route.isAdd = true;
      }
    });
    if (waitingRoutes.length == 0) {
      return;
    }
    const routeFiles = waitingRoutes
      .map((r) => r.filePath)
      .filter(Boolean) as string[];
    await this.joyDevServer.ensureModules(routeFiles);
  }

  @Tap()
  async onBeforeRender({
    req,
    res,
    pathname,
    query,
  }: {
    req: IncomingMessage;
    res: ServerResponse;
    pathname: string;
    query: ParsedUrlQuery;
  }): Promise<void> {
    await this.ensurePath(pathname);
  }

  @Tap()
  protected async onGenerateFiles() {
    console.log(">>>> IReactRouteDev. onGenerateFiles");
    const clientRoutes = this.filterRoutes((route) => !!route.isAdd);
    const clientFileContent = this.routesTemplate({ routes: clientRoutes });
    await this.fileGenerator.writeCommonFile("./routes.js", clientFileContent);
  }

  @Tap()
  protected async addTmpGenerateWatcherPaths(watchPaths: string[]) {
    watchPaths.push("./src");
    return watchPaths;
  }
}
