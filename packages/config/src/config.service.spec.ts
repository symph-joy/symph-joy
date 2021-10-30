import { Component, CoreContextFactory } from "@symph/core";
import { ConfigValue } from "./config-value.decorator";
import { ConfigService } from "./config.service";
import { Configurable } from "./configurable.decorator";
import { Max, MaxLength } from "@tsed/schema";
import { SYMPH_CONFIG_INIT_VALUE } from "./constants";

describe("config.service", () => {
  test(`Should inject config value to the prop of the configurable provider`, async () => {
    @Configurable()
    class BasicConfig {
      @ConfigValue()
      public msg: string;

      @ConfigValue({ default: false })
      public isOk: boolean;
    }

    @Component()
    class CustomConfigService extends ConfigService {
      async initialize(): Promise<void> {
        await super.initialize();
        this.mergeConfig({ msg: "From afterPropertiesSet", isOk: true });
      }
    }

    const context = await CoreContextFactory.createApplicationContext([CustomConfigService, BasicConfig]);
    const configService = await context.get(ConfigService);
    const basicConfig = await context.get(BasicConfig);
    expect(configService).toBeInstanceOf(CustomConfigService);
    expect(basicConfig.msg).toBe("From afterPropertiesSet");
    expect(basicConfig.isOk).toBe(true);
  });

  test(`Should inject a function config value to the prop of the configurable provider`, async () => {
    @Configurable()
    class BasicConfig {
      @ConfigValue()
      public funProp: () => any;
    }

    const funValue = () => {};

    @Component()
    class CustomConfigService extends ConfigService {
      async initialize(): Promise<void> {
        await super.initialize();
        this.mergeConfig({ funProp: funValue });
      }
    }

    const context = await CoreContextFactory.createApplicationContext([CustomConfigService, BasicConfig]);
    const configService = await context.get(ConfigService);
    const basicConfig = await context.get(BasicConfig);
    expect(configService).toBeInstanceOf(CustomConfigService);
    expect(basicConfig.funProp).toBe(funValue);
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

    const context = await CoreContextFactory.createApplicationContext([ConfigService, BasicConfig]);
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
