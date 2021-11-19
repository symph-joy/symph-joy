import { NodeConfigConfiguration, ServerConfigLoaderFactory } from "@symph/config/server";
import { ConfigLoaderFactory } from "@symph/config/dist/loader/factories/config-loader-factory";
import { Configuration } from "@symph/core";

@Configuration()
export class JoyConfigConfiguration extends NodeConfigConfiguration {
  protected isAutoLoadConfig(): boolean {
    return false;
  }

  getConfigLoaderFactory(): ConfigLoaderFactory {
    return new ServerConfigLoaderFactory();
  }
}
