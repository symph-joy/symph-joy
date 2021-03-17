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
import handlebars from "handlebars";
import { FileGenerator } from "../plugin/file-generator";

interface IReactRouteDev extends IReactRoute {
  filePath?: string;
  isAdd?: boolean;
}

const routesTemplate = handlebars.compile(
  readFileSync(join(__dirname, "./routes.handlebars"), "utf-8")
);

@Injectable()
export class JoyReactRouterService extends ReactRouter<IReactRouteDev> {
  constructor(
    private joyDevServer: NextDevServer,
    private fileScanner: FileScanner,
    private fileGenerator: FileGenerator
  ) {
    super();
  }

  extendRoute(route: IReactRoute): IReactRouteDev {
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

    const devRoute: IReactRouteDev = {
      ...route,
      filePath,
    };
    return devRoute;
  }

  protected mergeRouteExtendState(to: IReactRouteDev, from: IReactRouteDev) {
    to.isAdd = from.isAdd;
  }

  private plainRoutesTree(routes: IReactRouteDev[]): IReactRouteDev[] {
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
    const waitingRoutes: IReactRouteDev[] = [];
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
  private async onRegisterProviderAfter(
    provider: Provider,
    instanceWrapper: InstanceWrapper
  ) {
    if (!isClassProvider(provider)) {
      return;
    }
    this.addRouteProvider(provider);
    console.log(">>>> IReactRouteDev. onRegisterProviderAfter", provider);
  }

  @Tap()
  private async onReplaceProviderAfter(
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
  private async onGenerateFiles() {
    console.log(">>>> IReactRouteDev. onGenerateFiles");
    // const routeList: IReactRouteDev[] = [];
    // this.routes.forEach((route, key) => {
    //   routeList.push(route);
    // });
    // const serverFileContent = routesTemplate({ routes: routeList });
    // await this.fileGenerator.writeServerFile("./routes.js", serverFileContent);

    const clientRoutes = this.filterRoutes((route) => !!route.isAdd);
    const clientFileContent = routesTemplate({ routes: clientRoutes });
    await this.fileGenerator.writeCommonFile("./routes.js", clientFileContent);

    // await this.fileGenerator.writeServerFile("./routes.js", clientFileContent);
  }

  @Tap()
  private async addTmpGenerateWatcherPaths(watchPaths: string[]) {
    watchPaths.push("./src");
    return watchPaths;
  }
}
