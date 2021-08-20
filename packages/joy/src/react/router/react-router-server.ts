import { Inject, Component } from "@symph/core";
import { IReactRoute, ReactRouter } from "@symph/react";

@Component()
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
