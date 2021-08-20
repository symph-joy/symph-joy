import { AutowireHook, ClassProvider, Component, CoreContainer, CoreContext, HookType, IHook, RegisterTap, TProviderName } from "@symph/core";
import { getPrerenderMeta, PrerenderMeta } from "./prerender.decorator";
import { ApplicationConfig, ReactApplicationContext } from "@symph/react";
import { JoyPrerenderInterface } from "./prerender.interface";
import { IScanOutModule } from "../../joy-server/server/scanner/file-scanner";

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
  constructor(private readonly coreContext: CoreContext) {}

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

        if ((prerenderMeta as any).byProvider) {
          if (Array.isArray(name)) {
            ids.push(...name);
          } else {
            ids.push(name);
          }
        } else {
          this.prerenderList.push(prerenderMeta as PrerenderMeta);
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
  // protected async onRegisterProviderAfter(
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
    if (this.prerenderProviderIds.length === 0) {
      return [];
    }

    const modules = [] as Record<string, any>;
    let ids = [] as TProviderName[];
    this.prerenderProviderIds.forEach((it) => {
      modules.push(it.module.module);
      ids = ids.concat(it.ids);
    });

    const applicationConfig = new ApplicationConfig();
    const joyContainer = new CoreContainer();
    const reactApplicationContext = new ReactApplicationContext(modules, applicationConfig, joyContainer);
    await reactApplicationContext.init();

    const tasks = ids.map(async (prerenderId) => {
      const provider: JoyPrerenderInterface = await reactApplicationContext.get(prerenderId);
      const route = provider.getRoute() as string;
      // todo when route is a  controller class
      const isFallback = await provider.isFallback();
      const paths = await provider.getPaths(); // todo ParsedUrlQuery
      return { route, isFallback, paths } as JoyPrerenderInfo;
    });

    const generateList = await Promise.all(tasks);
    return [...this.prerenderList, ...generateList];
  }
}
