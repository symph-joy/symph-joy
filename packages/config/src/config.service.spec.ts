import { Component, ApplicationContextFactory } from "@symph/core";
import { Value } from "./config-value.decorator";
import { ConfigService } from "./config.service";
import { Max, MaxLength, Default, Property } from "@tsed/schema";
import { CONFIG_INIT_VALUE } from "./constants";

describe("config.service", () => {
  test(`Should inject config value to the prop of the configurable component`, async () => {
    @Component()
    class BasicConfig {
      @Value()
      public msg: string;
    }

    @Component()
    class CustomConfigService extends ConfigService {
      async initialize(): Promise<void> {
        await super.initialize();
        this.mergeConfig({ msg: "From afterPropertiesSet" });
      }
    }

    const context = await ApplicationContextFactory.createApplicationContext([CustomConfigService, BasicConfig]);
    const configService = await context.get(ConfigService);
    const basicConfig = await context.get(BasicConfig);
    expect(configService).toBeInstanceOf(CustomConfigService);
    expect(basicConfig.msg).toBe("From afterPropertiesSet");
  });

  test(`Should transform value with transform function.`, async () => {
    @Component()
    class BasicConfig {
      @Value({
        configKey: "msg",
        transform: (value: any) => {
          return Boolean(value);
        },
      })
      public hasMsg: boolean;

      @Value({
        transform: (value: any) => true,
      })
      public notTransformUndefined: boolean | undefined;
    }

    const context = await ApplicationContextFactory.createApplicationContext([
      {
        initValue: {
          name: CONFIG_INIT_VALUE,
          useValue: {
            msg: "hello",
          },
        },
      },
      ConfigService,
      BasicConfig,
    ]);
    const basicConfig = await context.get(BasicConfig);
    expect(basicConfig.hasMsg).toBe(true);
    expect(basicConfig.notTransformUndefined).toBe(undefined);
  });

  test(`Should inject a function config value to the prop of the configurable component`, async () => {
    @Component()
    class BasicConfig {
      @Value()
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

    const context = await ApplicationContextFactory.createApplicationContext([CustomConfigService, BasicConfig]);
    const configService = await context.get(ConfigService);
    const basicConfig = await context.get(BasicConfig);
    expect(configService).toBeInstanceOf(CustomConfigService);
    expect(basicConfig.funProp).toBe(funValue);
  });

  test(`Should inject multi config value to prop of a configurable component.`, async () => {
    @Component()
    class BasicConfig {
      @Value()
      public msg: string;

      @Value()
      public count: number;
    }

    const context = await ApplicationContextFactory.createApplicationContext([
      {
        initValue: {
          name: CONFIG_INIT_VALUE,
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

  describe("default value", () => {
    test(`should use default value.`, async () => {
      @Component()
      class BasicConfig {
        @Value({ default: "hello" })
        public msg: string;
      }

      const context = await ApplicationContextFactory.createApplicationContext([ConfigService, BasicConfig]);
      const basicConfig = await context.get(BasicConfig);
      expect(basicConfig.msg).toContain("hello");
    });

    test(`should use default schema array value.`, async () => {
      @Component()
      class BasicConfig {
        @Value()
        @Default([1, 2])
        public msg: number[];
      }

      const context = await ApplicationContextFactory.createApplicationContext([ConfigService, BasicConfig]);
      const basicConfig = await context.get(BasicConfig);
      expect(basicConfig.msg).toMatchObject([1, 2]);
    });

    test(`should use default schema value.`, async () => {
      @Component()
      class BasicConfig {
        @Value()
        @Default("hello")
        public msg: string;
      }

      const context = await ApplicationContextFactory.createApplicationContext([ConfigService, BasicConfig]);
      const basicConfig = await context.get(BasicConfig);
      expect(basicConfig.msg).toContain("hello");
    });

    test(`should use preset set value as default value.`, async () => {
      @Component()
      class BasicConfig {
        @Value()
        public msg = "hello";
      }

      const context = await ApplicationContextFactory.createApplicationContext([ConfigService, BasicConfig]);
      const basicConfig = await context.get(BasicConfig);
      expect(basicConfig.msg).toContain("hello");
    });

    test(`should inject default value, with class schema.`, async () => {
      class ConfigMsg {
        public value: string;

        @Default("1")
        public defaultStr: string;

        @Default([1, 2]) // 数组类型需要特殊处理， ajv 默认不知道数组类型赋默认值
        public defaultArr: number[];
      }

      @Component()
      class BasicConfig {
        @Value()
        public msg: ConfigMsg;

        @Value({ default: {} })
        // @Default({}) 不支持， 如果是对象类型， 不支持@Default装饰器。
        public msg1: ConfigMsg;
      }

      let error: any;
      const context = await ApplicationContextFactory.createApplicationContext([
        {
          initValue: {
            name: CONFIG_INIT_VALUE,
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
      const basicConfig = await context.get(BasicConfig);
      expect(basicConfig.msg.value).toBe("123456");
      expect(basicConfig.msg.defaultStr).toBe("1");
      expect(basicConfig.msg.defaultArr).toMatchObject([1, 2]);

      expect(basicConfig.msg1.value).toBe(undefined);
      expect(basicConfig.msg1.defaultStr).toBe("1");
      expect(basicConfig.msg1.defaultArr).toMatchObject([1, 2]);
    });
  });

  test(`Should override super class config definition.`, async () => {
    @Component()
    class Super {
      @Value({ default: "super" })
      public msg: string;
    }

    @Component()
    class Child extends Super {
      @Value({ default: "child" })
      public msg: string;
    }
    const context = await ApplicationContextFactory.createApplicationContext([ConfigService, Super, Child]);
    const superObj = await context.get(Super);
    const childObj = await context.get(Child);
    expect(superObj.msg).toBe("super");
    expect(childObj.msg).toBe("child");
  });

  describe("validate", () => {
    test(`should validate the config value, when type is a basic value type.`, async () => {
      @Component()
      class BasicConfig {
        @Value()
        @MaxLength(3)
        public msg: string;

        @Value()
        @Max(2)
        public count: number;
      }

      let error: any;
      try {
        await ApplicationContextFactory.createApplicationContext([
          {
            initValue: {
              name: CONFIG_INIT_VALUE,
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
      expect(error.message).toContain("more than 3 characters");
    });

    test(`should validate the config value, when type is a class.`, async () => {
      class ConfigMsg {
        @MaxLength(3)
        public value: string;
      }

      @Component()
      class BasicConfig {
        @Value()
        public msg: ConfigMsg;
      }

      let error: any;
      try {
        const context = await ApplicationContextFactory.createApplicationContext([
          {
            initValue: {
              name: CONFIG_INIT_VALUE,
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
      expect(error.message).toContain("more than 3 characters");
    });
  });
});
