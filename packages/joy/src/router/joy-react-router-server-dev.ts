import { Inject, Injectable } from "@symph/core";
import { IReactRoute, ReactRouter } from "@symph/react";

@Injectable()
export class JoyReactRouterServerDev extends ReactRouter {
  constructor(
    @Inject("joyReactAutoGenRoutes")
    private joyReactAutoGenRoutes: IReactRoute[]
  ) {
    super();
    console.log(">>> load joyReactAutoGenRoutes:", joyReactAutoGenRoutes);
    this.routes = joyReactAutoGenRoutes.map((it: any) => {
      return {
        ...it,
        component: it.component?.default,
      };
    });
  }

  // constructor(@Inject('fileGenerator') private fileGenerator: FileGenerator) {
  //   super()
  // }
  // public getRoutes(): IReactRoute[] {
  //   const genRoutesPath = this.fileGenerator.getCommonFilePath('routes.js')
  //   if (!existsSync(genRoutesPath)) {
  //     this.routes = []
  //   } else  {
  //     this.routes = require(genRoutesPath)
  //   }
  //   return this.routes
  // }

  // public getMatchedRoutes(pathname: string, routes?: IReactRoute[],  matchContext: IReactRoute[] = []): IReactRoute[] {
  //   routes = routes || this.routes || []
  //   if (!routes?.length) {
  //     return  matchContext
  //   }
  //   for (let i = 0; i < routes.length; i++) {
  //     const route = routes[i]
  //     const m = matchPath(pathname, route)
  //     if (!m) {
  //       continue
  //     }
  //     const matchedRoute = {...route}
  //     matchContext.push(matchedRoute)
  //     if (route.routes?.length){
  //       matchedRoute.routes = this.getMatchedRoutes(pathname, route.routes, matchContext)
  //     }
  //   }
  //   return  matchContext
  // }
}
