import { CoreContextFactory, IJoyContext } from "@symph/core";
import { BasicConfig } from "../src/basic-config";
import { ConfigConfiguration } from "../../../../src/config.configuration";
import { ConfigService } from "../../../../src/config.service";

describe("config basic", () => {
  let context: IJoyContext;
  let configService: ConfigService;
  let configuration: ConfigConfiguration;

  beforeAll(async () => {
    context = await CoreContextFactory.createApplicationContext({
      ConfigConfiguration,
      BasicConfig,
    });
    configuration = await context.get(ConfigConfiguration);
    configService = await context.get(ConfigService);
    await configuration.initConfig(require.resolve("../src/config-values.js"));
    // configService.loadConfig(require.resolve('../src/config-values.js'))
  });

  test(`should return been transformed value by route params pipe`, async () => {
    console.log(configService);
    const basicConfig = await context.get(BasicConfig);
    expect(basicConfig.msg).toBe("Hello world!");
  });

  afterAll(async () => {});
});
