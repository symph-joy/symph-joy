import { Autowire, Component } from "@symph/core";
import { IReactRoute, ReactRouter } from "@symph/react";

@Component()
export class ReactRouterServer extends ReactRouter {
  protected scannedModules = [] as Record<string, unknown>[];

  constructor(
    @Autowire("joyReactAutoGenRoutes")
    private joyReactAutoGenRoutes: IReactRoute[]
  ) {
    super();
    this.routes = joyReactAutoGenRoutes.map((it: any) => {
      return {
        ...it,
        component: it.component?.default,
      };
    });

    this.scannedModules = Array.from(new Set(joyReactAutoGenRoutes.map((r) => r.providerModule).filter(Boolean))) as Record<string, unknown>[];
  }

  public hasModuleScanned(mod: Record<string, unknown>): boolean {
    return this.scannedModules.includes(mod);
  }
}
