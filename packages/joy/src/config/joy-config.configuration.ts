import { NodeConfigConfiguration, ServerConfigLoaderFactory } from "@symph/config/server";
import { Configuration } from "@symph/core";
import { ConfigLoaderFactory } from "@symph/config";

@Configuration()
export class JoyConfigConfiguration extends NodeConfigConfiguration {
  protected isAutoLoadConfig(): boolean {
    return false;
  }

  getConfigLoaderFactory(): ConfigLoaderFactory {
    return new ServerConfigLoaderFactory();
  }
}
