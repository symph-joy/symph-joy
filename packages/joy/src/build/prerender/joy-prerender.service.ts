import { AutowireHook, ClassProvider, Component, ApplicationContext, HookType, IHook, RegisterTap, TProviderName } from "@symph/core";
import { getPrerenderMeta, PrerenderMeta, PrerenderMetaByProvider } from "./prerender.decorator";
import { JoyPrerenderInterface } from "./prerender.interface";
import { IScanOutModule } from "../scanner/file-scanner";
import { JoyReactAppServerConfiguration } from "../../react/joy-react-app-server.configuration";
import { JoyAppConfig } from "../../joy-server/server/joy-app-config";
import { JoyReactApplicationContext } from "../../react/joy-react-application-context";
import { getRouteMeta } from "@symph/react";
import { JoyReactRouterPlugin } from "../../react/router/joy-react-router-plugin";

export interface JoyPrerenderInfo {
  route: string;
  paths: string[]; // todo 这里需要支持query参数。
  isFallback: boolean;
  revalidate?: number;
}

interface PrerenderModule {
  module: IScanOutModule;
  ids: TProviderName[];
}

@Component()
export class JoyPrerenderService {
  constructor(
    private readonly coreContext: ApplicationContext,
    private readonly joyAppConfig: JoyAppConfig,
    private readonly joyReactRouteBuild: JoyReactRouterPlugin
  ) {}

  /**
   * 在服务端渲染html之前调用的hook
   */
  @AutowireHook({ parallel: false, type: HookType.Waterfall })
  private genPrerenderPath: IHook;

  private prerenderProviderIds: PrerenderModule[] = [];

  private prerenderList: PrerenderMeta[] = [];

  protected addFromScanOutModule(module: IScanOutModule): boolean {
    if (!module.providerDefines || module.providerDefines.size === 0) {
      return false;
    }
    const { mount } = module;
    let hasPrerender = false;
    const ids = [] as TProviderName[];
    module.providerDefines.forEach((providerDefine, exportKey) => {
      providerDefine.providers.forEach((provider) => {
        if (!(provider as ClassProvider).useClass) {
          return;
        }
        const { useClass, name } = provider as ClassProvider;
        const prerenderMeta = getPrerenderMeta(useClass);
        if (!prerenderMeta) {
          return;
        }

        if ((prerenderMeta as PrerenderMetaByProvider).byProvider) {
          if (Array.isArray(name)) {
            ids.push(...name);
          } else {
            ids.push(name);
          }
        } else {
          let { route, paths, isFallback } = prerenderMeta as PrerenderMeta;
          if (!route) {
            const routeMeta = getRouteMeta(useClass);
            if (routeMeta) {
              if (Array.isArray(routeMeta.path)) {
                throw new Error(
                  `The @Routes()'s path is an array, you should specify the prerender route like:@Prerender({route:"example-path"}) component(${useClass.name}).`
                );
              }
              route = mount ? mount + routeMeta.path : routeMeta.path;
              paths = paths || [routeMeta.path];
            } else if (module.resource) {
              // try resolve fsRoute
              const fsRoute = this.joyReactRouteBuild.getFsRoute(module.resource, provider, mount);
              if (fsRoute) {
                route = fsRoute.path;
                paths = paths || [fsRoute.path];
              }
            }
          }

          if (mount) {
            paths = paths.map((p) => mount + p);
          }

          this.prerenderList.push({
            route,
            paths,
            isFallback,
          } as PrerenderMeta);
        }
        hasPrerender = hasPrerender || !!prerenderMeta;
      });
    });
    if (ids.length > 0) {
      this.prerenderProviderIds.push({
        ids,
        module,
      });
    }
    return hasPrerender;
  }

  @RegisterTap()
  public async afterScanOutModuleHook(module: IScanOutModule) {
    this.addFromScanOutModule(module);
  }

  // @RegisterTap()
  // protected async onComponentRegisterAfter(
  //   provider: Provider,
  //   instanceWrapper: ComponentWrapper
  // ) {
  //   if (!isClassProvider(provider)) {
  //     return;
  //   }
  //   const {useClass, id} = provider;
  //   const prerenderMeta = getPrerenderMeta(useClass);
  //   if (!prerenderMeta) {
  //     return;
  //   }
  //
  //   if ((prerenderMeta as any).byProvider) {
  //     this.prerenderProviderIds.push(id);
  //   } else {
  //     this.prerenderList.push(prerenderMeta as PrerenderMeta);
  //   }
  // }

  public async getPrerenderList(): Promise<JoyPrerenderInfo[]> {
    if (this.prerenderProviderIds.length === 0 && this.prerenderList.length === 0) {
      return [];
    }

    const modules = [] as Record<string, any>[];
    let ids = [] as TProviderName[];
    this.prerenderProviderIds.forEach((it) => {
      modules.push(it.module.module);
      ids = ids.concat(it.ids);
    });

    // const applicationConfig = new ApplicationConfig();
    // const joyContainer = new ApplicationContainer();
    const reactApplicationContext = new JoyReactApplicationContext(JoyReactAppServerConfiguration, {});
    reactApplicationContext.container.addProviders([
      {
        name: "joyAppConfig",
        type: JoyAppConfig,
        useValue: this.joyAppConfig,
      },
    ]);
    await reactApplicationContext.init();
    reactApplicationContext.scannedModules.push(...modules); // 防止再次注册再编译时的模块，或导致路由等重复注册。
    reactApplicationContext.registerModule(modules);

    const tasks = ids.map(async (prerenderId) => {
      const provider: JoyPrerenderInterface = await reactApplicationContext.get(prerenderId);
      const route = provider.getRoute() as string;
      const isFallback = await provider.isFallback();
      const paths = await provider.getPaths();
      return { route, isFallback, paths } as JoyPrerenderInfo;
    });

    const generateList = await Promise.all(tasks);
    return [...this.prerenderList, ...generateList];
  }
}
