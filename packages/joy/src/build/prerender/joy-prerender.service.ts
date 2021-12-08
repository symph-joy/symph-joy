import { AutowireHook, ClassProvider, Component, ApplicationContext, HookType, IHook, RegisterTap, TProviderName } from "@symph/core";
import { getPrerenderMeta, PrerenderMeta, PrerenderMetaByProvider } from "./prerender.decorator";
import { IJoyPrerender } from "./prerender.interface";
import { IScanOutModule } from "../scanner/file-scanner";
import { JoyReactAppServerConfiguration } from "../../react/joy-react-app-server.configuration";
import { JoyAppConfig } from "../../joy-server/server/joy-app-config";
import { JoyReactApplicationContext } from "../../react/joy-react-application-context";
import { getRouteMeta, MountService } from "@symph/react";
import { JoyReactRouterPlugin } from "../../react/router/joy-react-router-plugin";

export interface JoyPrerenderInfo {
  route: string;
  paths: string[];
  /**
   * 提前获取的异步api接口，会根据api的请求路径，在对应目录中，生成包含整个响应的文件。
   * 在export生成api文件，不在build阶段生成，因为build后可以通过node运行整个应用，实时获取接口数据。
   */
  apis?: string[];
  isFallback: boolean;
  revalidate?: number;
}

interface PrerenderModule {
  module: IScanOutModule;
  names: TProviderName[];
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
    const names = [] as TProviderName[];
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
            names.push(...name);
          } else {
            names.push(name);
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
    if (names.length > 0) {
      this.prerenderProviderIds.push({
        names: names,
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
    let names = [] as TProviderName[];
    this.prerenderProviderIds.forEach((it) => {
      modules.push(it.module.module);
      names = names.concat(it.names);
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
    const mountService = await reactApplicationContext.get(MountService);

    const tasks = names.map(async (prerenderId) => {
      const provider: IJoyPrerender = await reactApplicationContext.get(prerenderId);
      const route = provider.getRoute() as string;
      const isFallback = await provider.isFallback();
      const paths = await provider.getPaths();
      const prerenderApis = provider.getApis && (await provider.getApis());
      const apis = [] as string[];
      if (prerenderApis?.length) {
        for (const prerenderApi of prerenderApis) {
          let apiFullPath: string;
          if (prerenderApi.isModuleApi === false) {
            apiFullPath = `${this.joyAppConfig.basePath}${this.joyAppConfig.getGlobalPrefix()}${prerenderApi.path}`;
          } else {
            apiFullPath = `${this.joyAppConfig.basePath}${this.joyAppConfig.getGlobalPrefix()}${mountService.getMount(prerenderId) || ""}${
              prerenderApi.path
            }`;
          }
          apis.push(apiFullPath);
        }
      }
      return { route, isFallback, paths, apis } as JoyPrerenderInfo;
    });

    const generateList = await Promise.all(tasks);
    return [...this.prerenderList, ...generateList];
  }
}
