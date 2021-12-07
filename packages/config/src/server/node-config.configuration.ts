import { Configuration } from "@symph/core";
import { ConfigConfiguration } from "../config.configuration";
import { ServerConfigLoaderFactory } from "./server-config-loader-factory";
import { ConfigLoaderFactory } from "../loader/config-loader-factory";

@Configuration()
export class NodeConfigConfiguration extends ConfigConfiguration {
  getConfigLoaderFactory(): ConfigLoaderFactory {
    return new ServerConfigLoaderFactory();
  }

  getDefaultConfig(): Record<string, unknown> {
    const defaultConfigs = super.getDefaultConfig();
    return Object.assign({}, defaultConfigs, {
      dir: process.cwd(),
    });
  }
}
