import {
  CoreContext,
  Hook,
  HookPipe,
  HookType,
  Injectable,
  InstanceWrapper,
  isClassProvider,
  Provider,
  Tap,
} from "@symph/core";
import { getPrerenderMeta, PrerenderMeta } from "./prerender.decorator";
import { ParsedUrlQuery } from "@symph/react";
import { JoyPrerenderInterface } from "./prerender.interface";

export interface JoyPrerenderInfo {
  route: string;
  paths: string[]; // todo 这里需要支持query参数。
  isFallback: boolean;
  revalidate?: number;
}

@Injectable()
export class JoyPrerenderService {
  constructor(private readonly coreContext: CoreContext) {}

  /**
   * 在服务端渲染html之前调用的hook
   */
  @Hook({ parallel: false, type: HookType.Waterfall })
  private genPrerenderPath: HookPipe;

  private prerenderProviderIds: string[] = [];

  private prerenderList: PrerenderMeta[] = [];

  @Tap()
  protected async onRegisterProviderAfter(
    provider: Provider,
    instanceWrapper: InstanceWrapper
  ) {
    if (!isClassProvider(provider)) {
      return;
    }
    const { useClass, id } = provider;
    const prerenderMeta = getPrerenderMeta(useClass);
    if (!prerenderMeta) {
      return;
    }

    if ((prerenderMeta as any).byProvider) {
      this.prerenderProviderIds.push(id);
    } else {
      this.prerenderList.push(prerenderMeta as PrerenderMeta);
    }
  }

  public async getPrerenderList(): Promise<JoyPrerenderInfo[]> {
    if (this.prerenderProviderIds.length === 0) {
      return [];
    }

    const tasks = this.prerenderProviderIds.map(async (prerenderId) => {
      const provider: JoyPrerenderInterface = await this.coreContext.get(
        prerenderId
      );
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
