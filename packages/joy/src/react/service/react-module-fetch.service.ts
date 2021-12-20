import { MountService, ReactApplicationContext } from "@symph/react";
import { ReactFetchService } from "./react-fetch.service";
import { ApplicationContext, IComponentInfoAware, ComponentAwareInfo, IComponentLifecycle } from "@symph/core";

export class ReactModuleFetchService implements IComponentInfoAware, IComponentLifecycle {
  public context: ReactApplicationContext;

  public joyFetchService: ReactFetchService;
  public mountService: MountService;

  setApplicationContext(coreContext: ApplicationContext): void {
    this.context = coreContext as ReactApplicationContext;
  }

  setProviderInfo(info: ComponentAwareInfo): void {
    this.componentName = info.name as string;
  }

  initialize(): Promise<void> | void {
    this.joyFetchService = this.context.getSync(ReactFetchService);
    this.mountService = this.context.getSync(MountService);
  }

  public componentName: string | undefined;

  public getMount(): string | undefined {
    // return getMount((this as any).constructor) || "";
    if (!this.componentName) {
      throw new Error("JoyModuleFetchService has not set component name.");
    }
    return this.mountService.getMount(this.componentName);
  }

  public fetchApi(path: string, init?: RequestInit): Promise<Response> {
    return this.joyFetchService.fetchApi(path, init);
  }

  public fetchModuleApi(path: string, init?: RequestInit): Promise<Response> {
    return this.joyFetchService.fetchModuleApi(this.getMount() || "", path, init);
  }
}
