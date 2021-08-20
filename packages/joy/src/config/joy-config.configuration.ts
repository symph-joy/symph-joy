import { ServerConfigConfiguration, ServerConfigLoaderFactory } from "@symph/config";
import { ConfigLoaderFactory } from "@symph/config/dist/loader/factories/config-loader-factory";
import { Configuration } from "@symph/core";

@Configuration()
export class JoyConfigConfiguration extends ServerConfigConfiguration {
  protected isAutoLoadConfig(): boolean {
    return false;
  }

  getConfigLoaderFactory(): ConfigLoaderFactory {
    return new ServerConfigLoaderFactory();
  }
}
