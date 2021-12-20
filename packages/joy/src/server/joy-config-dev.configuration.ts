import { NodeConfigConfiguration } from "@symph/config/server";
import { Configuration, ApplicationContext } from "@symph/core";
import { CONFIG_INIT_VALUE, ConfigLoaderFactory, ConfigService } from "@symph/config";
import merge from "lodash.merge";

@Configuration()
export class JoyConfigDevConfiguration extends NodeConfigConfiguration {
  private appContext: ApplicationContext;

  setApplicationContext(coreContext: ApplicationContext) {
    this.appContext = coreContext;
  }
  getConfigLoaderFactory(): ConfigLoaderFactory {
    return new ConfigLoaderFactory(); // 从父容器中继承配置值，不用重新加载配置。
  }

  // @Configuration.Component({ name: CONFIG_INIT_VALUE })
  // getInitConfig(): Record<string, unknown> {
  //   const parent = this.appContext.parent;
  //   if (parent) {
  //     const parentConfigService = parent.getSync(ConfigService);
  //     return parentConfigService.get();
  //   } else {
  //     return super.getDefaultConfig();
  //   }
  // }
}
