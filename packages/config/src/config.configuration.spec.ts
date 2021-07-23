import {
  Configuration,
  CoreContextFactory,
  Injectable,
  ValueProvider,
} from "@symph/core";
import { ConfigService } from "./config.service";
import { ConfigConfiguration } from "./config.configuration";
import path from "path";
import { SYMPH_CONFIG_INIT_VALUE } from "./constants";
import { FileConfigLoader } from "./loaders/file-config-loader";
import { ConfigLoader } from "./loaders/config-loader";
import { DirConfigLoader } from "./loaders/dir-config-loader";
import { DotenvConfigLoader } from "./loaders/dotenv-config-loader";

async function createConfigServie(
  configClazz: typeof ConfigConfiguration,
  entryModule: any = {}
): Promise<ConfigService> {
  const context = await CoreContextFactory.createApplicationContext([
    configClazz,
    entryModule,
  ]);
  return context.get(ConfigService);
}

describe("config.configuration", () => {
  test(`Should init with the initial value.`, async () => {
    const configService = await createConfigServie(ConfigConfiguration, {
      initValue: {
        id: SYMPH_CONFIG_INIT_VALUE,
        useValue: {
          msg: "hello",
        },
      } as ValueProvider,
    });
    expect(configService).toBeInstanceOf(ConfigService);
    expect(configService.get("msg")).toBe("hello");
  });

  test(`Should load the special config file.`, async () => {
    @Configuration()
    class CustomConfigConfiguration extends ConfigConfiguration {
      protected async getConfigLoaders(
        initConfig: Record<string, unknown>
      ): Promise<ConfigLoader[]> {
        return [
          new FileConfigLoader(
            path.join(__dirname, "./fixtures/configs/config1.js")
          ),
        ];
      }
    }

    const configService = await createConfigServie(CustomConfigConfiguration);
    expect(configService.get("msg")).toBe("hello1");
  });

  test(`Should load the config file which in dir tree.`, async () => {
    @Configuration()
    class CustomConfigConfiguration extends ConfigConfiguration {
      protected async getConfigLoaders(
        initConfig: Record<string, unknown>
      ): Promise<ConfigLoader[]> {
        return [
          new DirConfigLoader(
            path.join(__dirname, "./fixtures/configs"),
            "config1.js"
          ),
        ];
      }
    }

    const configService = await createConfigServie(CustomConfigConfiguration);
    expect(configService).toBeInstanceOf(ConfigService);
    expect(configService.get("msg")).toBe("hello1");
  });

  test(`Should load the .env config file.`, async () => {
    @Configuration()
    class CustomConfigConfiguration extends ConfigConfiguration {
      protected async getConfigLoaders(
        initConfig: Record<string, unknown>
      ): Promise<ConfigLoader[]> {
        return [
          new DotenvConfigLoader(
            path.join(__dirname, "./fixtures/configs/.env.test1"),
            true
          ),
        ];
      }
    }

    const configService = await createConfigServie(CustomConfigConfiguration);
    expect(configService).toBeInstanceOf(ConfigService);
    expect(configService.get("ENV_MSG")).toBe("hello1");
  });

  test(`Should load config in custom order. the next value should overwrite the before value.`, async () => {
    @Configuration()
    class CustomConfigConfiguration extends ConfigConfiguration {
      protected async getConfigLoaders(
        initConfig: Record<string, unknown>
      ): Promise<ConfigLoader[]> {
        const fsLoader1 = new FileConfigLoader(
          path.join(__dirname, "./fixtures/configs/config1.js")
        );
        const fsLoader2 = new FileConfigLoader(
          path.join(__dirname, "./fixtures/configs/config2.js")
        );
        return [fsLoader1, fsLoader2];
      }
    }

    const configService = await createConfigServie(CustomConfigConfiguration);
    expect(configService).toBeInstanceOf(ConfigService);
    expect(configService.get("msg")).toBe("hello2");
  });
});
