import { Injectable, Tap } from "@symph/core";
import { IReactRoute } from "@symph/react";
import { FileScanner } from "../../joy-server/server/scanner/file-scanner";
import { readFileSync } from "fs";
import { join } from "path";

import { FileGenerator } from "../../plugin/file-generator";
import { handlebars } from "../../lib/handlebars";
import {
  IJoyReactRouteBuild,
  JoyReactRouterPlugin,
} from "./joy-react-router-plugin";

interface IReactRouteBuildDev extends IJoyReactRouteBuild {
  srcPath?: string;
  isAdd?: boolean;
}

/**
 * used in dev build phase.
 */
@Injectable()
export class JoyReactRouterPluginDev extends JoyReactRouterPlugin<
  IReactRouteBuildDev
> {
  constructor(
    protected fileGenerator: FileGenerator,
    protected fileScanner: FileScanner
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

  public async getRouteFiles(pathname: string): Promise<string[] | undefined> {
    const matchedRoutes = this.getMatchedRoutes(pathname);
    if (!matchedRoutes) {
      return;
    }

    const usedRoutes = this.plainRoutesTree([...matchedRoutes]);
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
      .map((r) => r.srcPath)
      .filter(Boolean) as string[];

    return routeFiles;
  }

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
  //
  // }

  // @Tap()
  // protected async onGenerateFiles() {
  //   console.log(">>>> IReactRouteDev. onGenerateFiles");
  //   const clientRoutes = this.filterRoutes((route) => !!route.isAdd);
  //   const clientFileContent = this.routesTemplate({ routes: clientRoutes });
  //   await this.fileGenerator.writeClientFile("./routes.js", clientFileContent);
  //
  //   const serverFileContent = this.routesServerTemplate({ routes: clientRoutes });
  //   await this.fileGenerator.writeServerFile("./routes.js", serverFileContent);
  // }

  protected getClientRoutes(): IReactRouteBuildDev[] {
    return this.filterRoutes((route) => !!route.isAdd);
  }

  @Tap()
  protected async addTmpGenerateWatcherPaths(watchPaths: string[]) {
    watchPaths.push("./src");
    return watchPaths;
  }
}
