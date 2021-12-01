import { Configuration, ApplicationContextFactory, IApplicationContext } from "@symph/core";
import { BasicConfig } from "../src/basic-config";
import { ConfigConfiguration, ConfigService, ConfigLoaderFactory } from "@symph/config";
import { ServerConfigLoaderFactory } from "@symph/config/server";
import path from "path";

@Configuration()
class CustomConfig extends ConfigConfiguration {
  getConfigLoaderFactory(): ConfigLoaderFactory {
    return new ServerConfigLoaderFactory();
  }
  getDefaultConfig(): Record<string, unknown> {
    return {
      dir: path.join(__dirname, "../"),
    };
  }
}

describe("config basic", () => {
  let context: IApplicationContext;
  let configService: ConfigService;
  let configuration: ConfigConfiguration;

  beforeAll(async () => {
    context = await ApplicationContextFactory.createApplicationContext([CustomConfig, BasicConfig]);
    configuration = await context.get(ConfigConfiguration);
    configService = await context.get(ConfigService);
  }, 999999);

  describe("load files", () => {
    test(`Should load configs from joy.config`, async () => {
      const value = configService.get("joyMsg");
      expect(value).toBe("from joy.config");
    });

    test(`Should load configs from partial config`, async () => {
      const value = configService.get("partial");
      expect(value).toMatchObject({ msg: "from partial" });
    });

    test(`Should load configs from env config`, async () => {
      expect(configService.get("testMsg")).toBe("from config test");
    });

    test(`Should not load configs from other env config`, async () => {
      expect(configService.get("betaMsg")).toBe("from config");
    });

    test(`Should load configs from config.local.js all the time`, async () => {
      expect(configService.get("localMsg")).toBe("from config local");
    });
  });

  describe("config file types", () => {
    test(`Should load json config file`, async () => {
      const value = configService.get("config-json");
      expect(value).toMatchObject({ msg: "from config-json" });
    });

    test(`Should load ts config file`, async () => {
      const value = configService.get("config-ts");
      expect(value).toMatchObject({ msg: "from config-ts" });
    });

    test(`Should load esm config file`, async () => {
      const value = configService.get("config-esm");
      expect(value).toMatchObject({ msg: "from config-esm" });
    });
  });

  test(`Should inject config value into component`, async () => {
    expect(configService.get("msg")).toBe("Hello world!");
    const basicConfig = await context.get(BasicConfig);
    expect(basicConfig.msg).toBe("Hello world!");
  });

  test(`Should get config by object path`, async () => {
    const value = configService.get("objMsg.msg");
    expect(value).toBe("from config objMsg");
  });

  afterAll(async () => {});
});
