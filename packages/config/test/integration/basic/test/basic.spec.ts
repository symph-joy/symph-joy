import { Configuration, CoreContextFactory, IJoyContext } from "@symph/core";
import { BasicConfig } from "../src/basic-config";
import {
  ConfigConfiguration,
  ConfigService,
  FileConfigLoader,
  ConfigLoader,
} from "@symph/config";

@Configuration()
class CustomConfig extends ConfigConfiguration {
  protected async getConfigLoaders(): Promise<ConfigLoader[]> {
    return [
      new FileConfigLoader(require.resolve("../config/config-values.js")),
    ];
  }
}

describe("config basic", () => {
  let context: IJoyContext;
  let configService: ConfigService;
  let configuration: ConfigConfiguration;

  beforeAll(async () => {
    context = await CoreContextFactory.createApplicationContext([
      CustomConfig,
      BasicConfig,
    ]);
    configuration = await context.get(ConfigConfiguration);
    configService = await context.get(ConfigService);
  });

  test(`should return been transformed value by route params pipe`, async () => {
    const basicConfig = await context.get(BasicConfig);
    expect(basicConfig.msg).toBe("Hello world!");
  });

  afterAll(async () => {});
});
