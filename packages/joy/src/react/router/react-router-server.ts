import { Inject, Injectable } from "@symph/core";
import { IReactRoute, ReactRouter } from "@symph/react";

@Injectable()
export class ReactRouterServer extends ReactRouter {
  constructor(
    @Inject("joyReactAutoGenRoutes")
    private joyReactAutoGenRoutes: IReactRoute[]
  ) {
    super();
    this.routes = joyReactAutoGenRoutes.map((it: any) => {
      return {
        ...it,
        component: it.component?.default,
      };
    });
  }
}
