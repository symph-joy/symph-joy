import { Configuration, CoreContextFactory, ValueProvider } from "@symph/core";
import { ConfigService } from "./config.service";
import { ConfigConfiguration } from "./config.configuration";
import path from "path";
import { SYMPH_CONFIG_INIT_VALUE } from "./constants";
import { FileConfigLoader } from "./server/loaders/file-config-loader";
import { ConfigLoader } from "./loader/config-loader";
import { DirConfigLoader } from "./server/loaders/dir-config-loader";
import { DotenvConfigLoader } from "./server/loaders/dotenv-config-loader";
import { ConfigLoaderFactory } from "./loader/config-loader-factory";

async function createConfigService(configClazz: typeof ConfigConfiguration, entryModule: any = {}): Promise<ConfigService> {
  const context = await CoreContextFactory.createApplicationContext([configClazz, entryModule]);
  return context.get(ConfigService);
}

describe("config.configuration", () => {
  test(`Should init with the initial value.`, async () => {
    const configService = await createConfigService(ConfigConfiguration, {
      initValue: {
        name: SYMPH_CONFIG_INIT_VALUE,
        useValue: {
          msg: "hello",
        },
      } as ValueProvider,
    });
    expect(configService).toBeInstanceOf(ConfigService);
    expect(configService.get("msg")).toBe("hello");
  });

  test(`Should load the special config file.`, async () => {
    class LoaderFactory extends ConfigLoaderFactory {
      getLoaders(configs: Record<string, any>): ConfigLoader[] {
        return [new FileConfigLoader(path.join(__dirname, "./fixtures/configs/config1.js"))];
      }
    }
    @Configuration()
    class CustomConfigConfiguration extends ConfigConfiguration {
      getConfigLoaderFactory(): ConfigLoaderFactory {
        return new LoaderFactory();
      }

      // protected async getConfigLoaders(
      //   initConfig: Record<string, unknown>
      // ): Promise<ConfigLoader[]> {
      //   return [
      //     new FileConfigLoader(
      //       path.join(__dirname, "./fixtures/configs/config1.js")
      //     ),
      //   ];
      // }
    }

    const configService = await createConfigService(CustomConfigConfiguration);
    expect(configService.get("msg")).toBe("hello1");
  });

  test(`Should manually load config.`, async () => {
    class LoaderFactory extends ConfigLoaderFactory {
      getLoaders(configs: Record<string, any>): ConfigLoader[] {
        return [new FileConfigLoader(path.join(__dirname, "./fixtures/configs/config1.js"))];
      }
    }
    @Configuration()
    class CustomConfigConfiguration extends ConfigConfiguration {
      getConfigLoaderFactory(): ConfigLoaderFactory {
        return new LoaderFactory();
      }

      // close auto load config files.
      protected isAutoLoadConfig(): boolean {
        return false;
      }
    }

    const configService = await createConfigService(CustomConfigConfiguration, {
      initValue: {
        name: SYMPH_CONFIG_INIT_VALUE,
        useValue: {
          msg: "hello",
        },
      } as ValueProvider,
    });
    expect(configService.get("msg")).toBe("hello");
    await configService.loadConfig();
    expect(configService.get("msg")).toBe("hello1");
  });

  test(`Should load the config file which in dir tree.`, async () => {
    class LoaderFactory extends ConfigLoaderFactory {
      getLoaders(configs: Record<string, any>): ConfigLoader[] {
        return [new DirConfigLoader(path.join(__dirname, "./fixtures/configs"), "config1.js")];
      }
    }

    @Configuration()
    class CustomConfigConfiguration extends ConfigConfiguration {
      getConfigLoaderFactory(): ConfigLoaderFactory {
        return new LoaderFactory();
      }

      // protected async getConfigLoaders(
      //   initConfig: Record<string, unknown>
      // ): Promise<ConfigLoader[]> {
      //   return [
      //     new DirConfigLoader(
      //       path.join(__dirname, "./fixtures/configs"),
      //       "config1.js"
      //     ),
      //   ];
      // }
    }

    const configService = await createConfigService(CustomConfigConfiguration);
    expect(configService).toBeInstanceOf(ConfigService);
    expect(configService.get("msg")).toBe("hello1");
  });

  test(`Should load the .env config file.`, async () => {
    class LoaderFactory extends ConfigLoaderFactory {
      getLoaders(configs: Record<string, any>): ConfigLoader[] {
        return [new DotenvConfigLoader(path.join(__dirname, "./fixtures/configs/.env.test1"), true)];
      }
    }

    @Configuration()
    class CustomConfigConfiguration extends ConfigConfiguration {
      getConfigLoaderFactory(): ConfigLoaderFactory {
        return new LoaderFactory();
      }

      // protected async getConfigLoaders(
      //   initConfig: Record<string, unknown>
      // ): Promise<ConfigLoader[]> {
      //   return [
      //     new DotenvConfigLoader(
      //       path.join(__dirname, "./fixtures/configs/.env.test1"),
      //       true
      //     ),
      //   ];
      // }
    }

    const configService = await createConfigService(CustomConfigConfiguration);
    expect(configService).toBeInstanceOf(ConfigService);
    expect(configService.get("ENV_MSG")).toBe("hello1");
  });

  test(`Should load config in custom order. the next value should overwrite the before value.`, async () => {
    class LoaderFactory extends ConfigLoaderFactory {
      getLoaders(configs: Record<string, any>): ConfigLoader[] {
        const fsLoader1 = new FileConfigLoader(path.join(__dirname, "./fixtures/configs/config1.js"));
        const fsLoader2 = new FileConfigLoader(path.join(__dirname, "./fixtures/configs/config2.js"));
        return [fsLoader1, fsLoader2];
      }
    }

    @Configuration()
    class CustomConfigConfiguration extends ConfigConfiguration {
      getConfigLoaderFactory(): ConfigLoaderFactory {
        return new LoaderFactory();
      }

      // protected async getConfigLoaders(
      //   initConfig: Record<string, unknown>
      // ): Promise<ConfigLoader[]> {
      //   const fsLoader1 = new FileConfigLoader(
      //     path.join(__dirname, "./fixtures/configs/config1.js")
      //   );
      //   const fsLoader2 = new FileConfigLoader(
      //     path.join(__dirname, "./fixtures/configs/config2.js")
      //   );
      //   return [fsLoader1, fsLoader2];
      // }
    }

    const configService = await createConfigService(CustomConfigConfiguration);
    expect(configService).toBeInstanceOf(ConfigService);
    expect(configService.get("msg")).toBe("hello2");
  });
});
