import { ApplicationContext, ClassComponent, Component, HookType, IHook, InjectHook, RegisterTap } from "@symph/core";
import { getPrerenderMeta, PrerenderMeta } from "./prerender.decorator";
import { IJoyPrerender } from "./prerender.interface";
import { IScanOutModule } from "../scanner/file-scanner";
import { JoyReactAppServerConfiguration } from "../../react/joy-react-app-server.configuration";
import { JoyAppConfig } from "../../joy-server/server/joy-app-config";
import { JoyReactApplicationContext } from "../../react/joy-react-application-context";
import { getRouteMeta, MountService } from "@symph/react";
import { JoyReactRouterPlugin } from "../../react/router/joy-react-router-plugin";
import { IGenerateFiles } from "../file-generator";
import { handlebars } from "../../lib/handlebars";
import { fileExists } from "../../lib/file-exists";

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
  metas: {
    component: ClassComponent;
    prerenderMeta: PrerenderMeta;
  }[];
}

@Component()
export class JoyPrerenderService {
  constructor(
    private readonly coreContext: ApplicationContext,
    private readonly joyConfig: JoyAppConfig,
    private readonly joyReactRoute: JoyReactRouterPlugin
  ) {}

  /**
   * 在服务端渲染html之前调用的hook
   */
  @InjectHook({ parallel: false, type: HookType.Waterfall })
  private genPrerenderPath: IHook;

  private prerenderCompModules: PrerenderModule[] = [];

  protected addFromScanOutModule(module: IScanOutModule): boolean {
    if (!module.providerDefines || module.providerDefines.size === 0) {
      return false;
    }
    const { mount } = module;
    let hasPrerender = false;
    const metas = [] as {
      component: ClassComponent; // 被 @Prerender() 装饰的类，可能是：1 IJoyPrerender 类， 2 ReactRoute 类；3 启用约定路由时的 ReactController；
      prerenderMeta: PrerenderMeta;
    }[];
    module.providerDefines.forEach((providerDefine, exportKey) => {
      providerDefine.providers.forEach((provider) => {
        if (!(provider as ClassComponent).useClass) {
          return;
        }
        const { useClass, name } = provider as ClassComponent;
        const prerenderMeta = getPrerenderMeta(useClass);
        if (!prerenderMeta) {
          return;
        }

        if (prerenderMeta.isFormPrerender) {
          metas.push({
            component: provider as ClassComponent,
            prerenderMeta: prerenderMeta,
          });
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
              const fsRoute = this.joyReactRoute.getFsRoute(module.resource, mount);
              if (fsRoute) {
                fsRoute.componentName = provider?.name;
                fsRoute.componentPackage = provider?.package;
                route = fsRoute.path;
                paths = paths || [fsRoute.path];
              }
            }
          }

          if (!paths?.length) {
            paths = [route];
          }

          if (mount) {
            paths = paths.map((p) => mount + p);
          }
          metas.push({
            component: provider as ClassComponent,
            prerenderMeta: {
              ...prerenderMeta,
              route,
              paths,
            } as PrerenderMeta,
          });
        }

        hasPrerender = hasPrerender || !!prerenderMeta;
      });
    });
    if (metas.length > 0) {
      this.prerenderCompModules.push({
        metas,
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

  public async getPrerenderList(isGetPaths = true): Promise<JoyPrerenderInfo[]> {
    if (this.prerenderCompModules.length === 0) {
      return [];
    }

    const bundlePath = this.joyConfig.resolveBuildOutDir("react/server/prerender-modules.js");
    if (!(await fileExists(bundlePath, "file"))) {
      throw new Error("Prerender bundle is not exists");
    }

    const modules = require(bundlePath).default as Record<string, any>[];
    let mates = [] as {
      component: ClassComponent;
      prerenderMeta: PrerenderMeta;
    }[];
    this.prerenderCompModules.forEach((it) => {
      mates = mates.concat(it.metas);
    });

    const reactApplicationContext = new JoyReactApplicationContext(JoyReactAppServerConfiguration, {});
    reactApplicationContext.container.addProviders([
      {
        name: "joyAppConfig",
        type: JoyAppConfig,
        useValue: this.joyConfig,
      },
    ]);
    await reactApplicationContext.init();
    reactApplicationContext.scannedModules.push(...modules); // 防止再次注册再编译时的模块，或导致路由等重复注册。
    reactApplicationContext.registerModule(modules);
    const mountService = await reactApplicationContext.get(MountService);

    const tasks = mates.map(async ({ component, prerenderMeta }) => {
      if (!prerenderMeta.isFormPrerender) {
        const { route, paths, isFallback } = prerenderMeta;
        return { route, paths, isFallback };
      }

      const componentName = component.name;
      const provider: IJoyPrerender = await reactApplicationContext.get(componentName);
      let route: string = this.getComponentRoute(prerenderMeta);
      const isFallback = await provider.isFallback();
      const paths = isGetPaths ? await provider.getPaths() : undefined;
      const prerenderApis = provider.getApis && (await provider.getApis());
      const apis = [] as string[];
      if (prerenderApis?.length) {
        for (const prerenderApi of prerenderApis) {
          let apiFullPath: string;
          if (prerenderApi.isModuleApi === false) {
            apiFullPath = `${this.joyConfig.basePath}${this.joyConfig.getGlobalPrefix()}${prerenderApi.path}`;
          } else {
            apiFullPath = `${this.joyConfig.basePath}${this.joyConfig.getGlobalPrefix()}${mountService.getMount(componentName) || ""}${
              prerenderApi.path
            }`;
          }
          apis.push(apiFullPath);
        }
      }
      return { route, isFallback, paths, apis } as JoyPrerenderInfo;
    });

    const generateList = await Promise.all(tasks);
    return generateList;
  }

  public async getPrerenderRoutes(): Promise<{ modulePaths: string[]; routes: string[] }> {
    const routes = new Set<string>();
    const modulePaths = new Set<string>();
    if (this.prerenderCompModules?.length) {
      for (const md of this.prerenderCompModules) {
        if (md.module.resource) {
          modulePaths.add(md.module.resource);
        }
        if (md.metas?.length) {
          for (const meta of md.metas) {
            const { prerenderMeta } = meta;
            let route: string;

            if (prerenderMeta.route) {
              route = prerenderMeta.route;
            } else {
              route = this.getComponentRoute(prerenderMeta);
            }

            routes.add(route);
          }
        }
      }
    }

    return { modulePaths: Array.from(modulePaths), routes: Array.from(routes.values()) };
  }

  private getComponentRoute(prerenderMeta: PrerenderMeta): string {
    let route: string = prerenderMeta.route;
    if (!route && prerenderMeta.routeComponent) {
      const routeMeta = getRouteMeta(prerenderMeta.routeComponent);
      if (routeMeta) {
        if (Array.isArray(routeMeta.path)) {
          route = routeMeta.path[0];
        } else {
          route = routeMeta.path;
        }
      }
    }
    return route;
  }

  @RegisterTap()
  protected async onGenerateFiles(genFiles: IGenerateFiles) {
    const { routes, modulePaths } = await this.getPrerenderRoutes();

    genFiles["./react/entries/prerender-modules.js"] = PrerenderModulesTmp({
      modulePaths,
    });

    genFiles["./react/client/joyPrerenderRoutes.js"] = PrerenderRoutesTmp({
      routes,
    });
    return genFiles;
  }
}

const PrerenderModulesTmp = handlebars.compile(`
{{#modulePaths}}
import * as m{{@index}} from "{{this}}";
{{/modulePaths}}

export default [{{#modulePaths}}m{{@index}},{{/modulePaths}}];
`);

const PrerenderRoutesTmp = handlebars.compile(`
          export const joyPrerenderRoutes = {
            name: "joyPrerenderRoutes",
            useValue: {{json routes}}
          }
    `);
