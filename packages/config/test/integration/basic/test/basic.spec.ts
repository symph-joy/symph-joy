import { Configuration, CoreContextFactory, ICoreContext } from "@symph/core";
import { BasicConfig } from "../src/basic-config";
import { ConfigConfiguration, ConfigService, ConfigLoader, ConfigLoaderFactory } from "@symph/config";
import { FileConfigLoader } from "@symph/config/server";

class LoaderFactory extends ConfigLoaderFactory {
  getLoaders(configs: Record<string, any>): ConfigLoader[] {
    return [new FileConfigLoader(require.resolve("../config/config-values.js"))];
  }
}

@Configuration()
class CustomConfig extends ConfigConfiguration {
  getConfigLoaderFactory(): ConfigLoaderFactory {
    return new LoaderFactory();
  }
}

describe("config basic", () => {
  let context: ICoreContext;
  let configService: ConfigService;
  let configuration: ConfigConfiguration;

  beforeAll(async () => {
    context = await CoreContextFactory.createApplicationContext([CustomConfig, BasicConfig]);
    configuration = await context.get(ConfigConfiguration);
    configService = await context.get(ConfigService);
  });

  test(`should set config value.`, async () => {
    const configService = await context.get(ConfigService);
    expect(configService.get("msg")).toBe("Hello world!");
    const basicConfig = await context.get(BasicConfig);
    expect(basicConfig.msg).toBe("Hello world!");
  });

  afterAll(async () => {});
});
