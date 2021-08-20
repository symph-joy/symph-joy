import { CoreContextFactory, Component } from "@symph/core";
import { ConfigValue } from "./config-value.decorator";
import { ConfigService } from "./config.service";
import { Configurable } from "./configurable.decorator";
import { Max, MaxLength, MinLength, Schema } from "@tsed/schema";
import { SYMPH_CONFIG_INIT_VALUE } from "./constants";
import { ConfigLoaderFactory } from "./loader/factories/config-loader-factory";

describe("config.service", () => {
  test(`Should inject config value to prop of a configurable provider`, async () => {
    @Configurable()
    class BasicConfig {
      @ConfigValue()
      public msg: string;

      @ConfigValue({ default: false })
      public isOk: boolean;
    }

    @Component()
    class CustomConfigService extends ConfigService {
      async afterPropertiesSet(): Promise<void> {
        await super.afterPropertiesSet();
        this.mergeConfig({ msg: "From afterPropertiesSet", isOk: true });
      }
    }

    const context = await CoreContextFactory.createApplicationContext([ConfigLoaderFactory, CustomConfigService, BasicConfig]);
    const configService = await context.get(ConfigService);
    const basicConfig = await context.get(BasicConfig);
    expect(configService).toBeInstanceOf(CustomConfigService);
    expect(basicConfig.msg).toBe("From afterPropertiesSet");
    expect(basicConfig.isOk).toBe(true);
  });

  test(`Should inject multi config value to prop of a configurable provider.`, async () => {
    @Configurable()
    class BasicConfig {
      @ConfigValue()
      public msg: string;

      @ConfigValue()
      public count: number;
    }

    const context = await CoreContextFactory.createApplicationContext([
      {
        initValue: {
          name: SYMPH_CONFIG_INIT_VALUE,
          useValue: {
            msg: "1",
            count: 1,
          },
        },
      },
      ConfigLoaderFactory,
      ConfigService,
      BasicConfig,
    ]);
    const basicConfig = await context.get(BasicConfig);
    expect(basicConfig.msg).toBe("1");
    expect(basicConfig.count).toBe(1);
  });

  test(`should use default value.`, async () => {
    @Configurable()
    @Component()
    class BasicConfig {
      @ConfigValue({ default: "hello" })
      public msg: string;
    }

    const context = await CoreContextFactory.createApplicationContext([ConfigLoaderFactory, ConfigService, BasicConfig]);
    const basicConfig = await context.get(BasicConfig);
    expect(basicConfig.msg).toContain("hello");
  });

  describe("validate", () => {
    test(`should validate the config value, when type is a basic value type.`, async () => {
      @Configurable()
      class BasicConfig {
        @ConfigValue()
        @MaxLength(3)
        public msg: string;

        @ConfigValue()
        @Max(2)
        public count: number;
      }

      let error: any;
      try {
        await CoreContextFactory.createApplicationContext([
          {
            initValue: {
              name: SYMPH_CONFIG_INIT_VALUE,
              useValue: {
                msg: "123456",
                count: 3,
              },
            },
          },
          ConfigLoaderFactory,
          ConfigService,
          BasicConfig,
        ]);
      } catch (e) {
        error = e;
      }
      expect(error).toBeTruthy();
      expect(error.message).toContain("should NOT be longer than 3 characters");
    });

    test(`should validate the config value, when type is a object.`, async () => {
      class ConfigMsg {
        @MaxLength(3)
        public value: string;
      }

      @Configurable()
      @Component()
      class BasicConfig {
        @ConfigValue()
        public msg: ConfigMsg;
      }

      let error: any;
      try {
        const context = await CoreContextFactory.createApplicationContext([
          {
            initValue: {
              name: SYMPH_CONFIG_INIT_VALUE,
              useValue: {
                msg: {
                  value: "123456",
                },
              },
            },
          },
          ConfigLoaderFactory,
          ConfigService,
          BasicConfig,
        ]);
        const basicConfig = context.get(BasicConfig);
        expect(basicConfig).toBeNull();
      } catch (e) {
        error = e;
      }
      expect(error.message).toContain("should NOT be longer than 3 characters");
    });
  });
});
