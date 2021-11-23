import { NodeConfigConfiguration } from "@symph/config/server";
import { Configuration, CoreContext } from "@symph/core";
import { ConfigLoaderFactory, ConfigService } from "@symph/config";
import merge from "lodash.merge";

@Configuration()
export class JoyConfigDevConfiguration extends NodeConfigConfiguration {
  private appContext: CoreContext;

  setApplicationContext(coreContext: CoreContext) {
    this.appContext = coreContext;
  }
  getConfigLoaderFactory(): ConfigLoaderFactory {
    return new ConfigLoaderFactory(); // 从父容器中继承配置值，不用重新加载配置。
  }

  getDefaultConfig(): Record<string, unknown> {
    const parent = this.appContext.parent;
    if (parent) {
      const parentConfigService = parent.syncGet(ConfigService);
      return merge(super.getDefaultConfig(), parentConfigService.get());
    } else {
      return super.getDefaultConfig();
    }
  }
}
