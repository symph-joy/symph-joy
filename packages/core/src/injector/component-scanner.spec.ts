import "reflect-metadata";
import { ComponentScanner } from "./component-scanner";
import { Configuration } from "../decorators/core/configuration/configuration.decorator";
import { Inject, Component, Optional } from "../decorators/core";
import { EntryType, IApplicationContext, Scope } from "../interfaces";
import { ApplicationContainer } from "./index";
import { Injector } from "./injector";
import { HookCenter } from "../hook/hook-center";
import { InjectCustomOptionsInterface } from "../interfaces/inject-custom-options.interface";
import { ApplicationContext } from "../application-context";

function instanceContainer(): ApplicationContainer {
  const container = new ApplicationContainer();
  const hookCenter = new HookCenter();
  hookCenter.registerProviderHooks(container);
  return container;
}

function createTestAppContext(entry?: EntryType[], parent?: IApplicationContext): [ApplicationContext, ApplicationContainer, Injector] {
  const context = new ApplicationContext();
  const container = context.container;
  // @ts-ignore
  const injector = context.injector;
  return [context, container, injector];
}

describe("component-scanner", () => {
  describe("scan configuration class", () => {
    const container = new ApplicationContainer();
    const componentScanner = new ComponentScanner();

    @Component()
    class TestProvider {
      public msg: string;
    }

    test("should scan out a class provider", async () => {
      @Configuration()
      class TestConfig {
        public prop1 = "value1";

        @Configuration.Component()
        public testProvider: TestProvider;
      }

      const providers = await componentScanner.scanForConfig(TestConfig);
      expect(providers && providers.length).toBe(2);
      const testProvider = providers[1];
      expect(testProvider).toMatchObject({
        name: "testProvider",
        useClass: TestProvider,
        type: TestProvider,
        scope: Scope.SINGLETON,
      });
    });

    test("should scan out a factory provider", async () => {
      @Configuration()
      class TestConfig {
        @Configuration.Component()
        public factoryProvider(): TestProvider {
          const p = new TestProvider();
          p.msg = "from factoryProvider 1";
          return p;
        }
      }

      const providers = await componentScanner.scanForConfig(TestConfig);
      expect(providers && providers.length).toBe(2);
      const factoryProvider = providers[1];
      expect(factoryProvider).toMatchObject({
        name: "factoryProvider",
        useFactory: { factory: TestConfig, property: "factoryProvider" },
        inject: [],
        type: TestProvider,
        scope: Scope.SINGLETON,
      });
    });

    test("should scan out a factory provider，with custom inject param", async () => {
      @Configuration()
      class TestConfig {
        @Configuration.Component()
        public factoryProvider(@Inject("initValue") initValue: string): TestProvider {
          const p = new TestProvider();
          p.msg = initValue;
          return p;
        }
      }

      const providers = await componentScanner.scanForConfig(TestConfig);
      expect(providers && providers.length).toBe(2);
      const factoryProvider = providers[1];
      expect(factoryProvider).toMatchObject({
        name: "factoryProvider",
        useFactory: { factory: TestConfig, property: "factoryProvider" },
        inject: [
          {
            type: undefined,
            name: "initValue",
          } as InjectCustomOptionsInterface,
        ],
        type: TestProvider,
        scope: Scope.SINGLETON,
      });
    });

    test("should scan out a factory provider，with optional param", async () => {
      @Configuration()
      class TestConfig {
        @Configuration.Component()
        public factoryProvider(@Optional() @Inject("initValue") initValue: string): TestProvider {
          const p = new TestProvider();
          p.msg = initValue;
          return p;
        }
      }

      const providers = await componentScanner.scanForConfig(TestConfig);
      expect(providers && providers.length).toBe(2);
      const factoryProvider = providers[1];
      expect(factoryProvider).toMatchObject({
        name: "factoryProvider",
        useFactory: { factory: TestConfig, property: "factoryProvider" },
        inject: [
          {
            type: undefined,
            name: "initValue",
            isOptional: true,
          } as InjectCustomOptionsInterface,
        ],
        type: TestProvider,
        scope: Scope.SINGLETON,
      });
    });

    test("should scan out a value provider", async () => {
      const valueProvider = {
        valueProvider: {
          name: "valueProvider",
          type: String,
          useValue: "hello",
        },
      };

      const providers = await componentScanner.scan(valueProvider);
      expect(providers && providers.length).toBe(1);
      const provider = providers[0];
      expect(provider).toMatchObject({
        name: "valueProvider",
        useValue: "hello",
        type: String,
      });
    });

    test("should scan out a provider, with meta data", async () => {
      @Configuration()
      class TestConfig {
        @Configuration.Component({
          name: "testProvider1",
          scope: Scope.PROTOTYPE,
        })
        public testProvider: TestProvider;
      }

      const providers = await componentScanner.scanForConfig(TestConfig);
      expect(providers && providers.length).toBe(2);
      const testProvider1 = providers[1];
      expect(testProvider1).toMatchObject({
        name: "testProvider1",
        useClass: TestProvider,
        scope: Scope.PROTOTYPE,
        type: TestProvider,
      });
    });

    test("should scan out providers from base configuration class", async () => {
      @Component()
      class TestProvider1 {
        public msg: string;
      }

      @Configuration()
      class TestConfig {
        @Configuration.Component()
        public testProvider: TestProvider;
      }

      @Configuration()
      class ExtendConfig extends TestConfig {
        @Configuration.Component()
        public extendTestProvider: TestProvider1;
      }

      const providers = await componentScanner.scanForConfig(ExtendConfig);
      const testProvider = providers.find((v) => v.name === "testProvider");
      const extendTestProvider = providers.find((v) => v.name === "extendTestProvider");
      expect(testProvider).toMatchObject({
        name: "testProvider",
        useClass: TestProvider,
        type: TestProvider,
        scope: Scope.SINGLETON,
      });
      expect(extendTestProvider).toMatchObject({
        name: "extendTestProvider",
        useClass: TestProvider1,
        type: TestProvider1,
        scope: Scope.SINGLETON,
      });
    });

    test("should override provider defines by child configuration class", async () => {
      @Component()
      class TestProvider1 {
        public msg: string;
      }

      @Configuration()
      class TestConfig {
        @Configuration.Component()
        public testProvider: TestProvider;
      }

      @Component()
      class TestProvider2 extends TestProvider1 {
        public msg: string;
      }

      @Configuration()
      class ExtendConfig extends TestConfig {
        @Configuration.Component()
        public testProvider: TestProvider2;
      }

      const providers = await componentScanner.scanForConfig(ExtendConfig);
      const testProvider = providers.find((v) => v.name === "testProvider");

      expect(testProvider).toMatchObject({
        name: "testProvider",
        useClass: TestProvider2,
        type: TestProvider2,
        scope: Scope.SINGLETON,
      });
    });
  });

  describe("scan module exports", () => {
    const container1 = instanceContainer();
    const componentScanner = new ComponentScanner();

    @Component({ scope: Scope.PROTOTYPE })
    class TestProvider {
      public msg: string;
    }

    test("should scan out a class provider", async () => {
      const exports = {
        TestProvider,
      };
      const providers = await componentScanner.scan(exports);
      container1.addProviders(providers);
      expect(providers && providers.length).toBe(1);
      const testProvider = providers[0];
      expect(testProvider).toMatchObject({
        name: "testProvider",
        useClass: TestProvider,
        type: TestProvider,
        scope: Scope.PROTOTYPE,
        lazyRegister: false,
      });
    });

    test("should scan out providers", async () => {
      @Configuration()
      class TestConfig {
        @Configuration.Component()
        public testProvider1: TestProvider;
      }

      const exports = {
        TestProvider,
        TestConfig,
      };
      const providers = await componentScanner.scan(exports);
      container1.addProviders(providers);
      expect(providers && providers.length).toBe(3);
      const testProvider = providers.find((it) => it.name === "testProvider");
      const testProvider1 = providers.find((it) => it.name === "testProvider1");
      expect(testProvider).toMatchObject({
        name: "testProvider",
        useClass: TestProvider,
        type: TestProvider,
        scope: Scope.PROTOTYPE,
        lazyRegister: false,
      });
      expect(testProvider1).toMatchObject({
        name: "testProvider1",
        useClass: TestProvider,
        type: TestProvider,
        scope: Scope.SINGLETON,
      });
    });
  });

  describe("scan imports", () => {
    const container = new ApplicationContainer();
    const componentScanner = new ComponentScanner();

    test("should scan cover the imports modules", async () => {
      @Component()
      class TestProvider {
        public msg: string;
      }

      @Configuration()
      class DepConfig {
        @Configuration.Component()
        public testProvider: TestProvider;
      }

      @Configuration({ imports: { DepConfig } })
      class Main {}

      const providers = await componentScanner.scan(Main);
      const testProvider = providers.find((v) => v.name === "testProvider");
      expect(testProvider).not.toBeNull();
    });
  });

  describe("scan an array entry", () => {
    const container = new ApplicationContainer();
    const componentScanner = new ComponentScanner();

    test("should scan out providers in all array items", async () => {
      @Component()
      class TestProvider1 {}

      @Component()
      class TestProvider2 {}

      @Configuration()
      class DepConfig {
        @Configuration.Component()
        public testProvider2: TestProvider2;
      }

      const providers = await componentScanner.scan([TestProvider1, DepConfig]);
      expect(providers.length).toBe(3);
    });
  });

  describe("scan nest config", () => {
    const container = new ApplicationContainer();
    const componentScanner = new ComponentScanner();

    test("should scan out providers, when config class is nested in object", async () => {
      @Component()
      class TestProvider1 {}

      @Component()
      class TestProvider2 {}

      @Configuration()
      class Config1 {
        @Configuration.Component()
        public testProvider2: TestProvider2;
      }

      const providers = await componentScanner.scan({ TestProvider1, Config1 });
      expect(providers.length).toBe(3);
    });

    test("should scan out providers, when sub config class is nested on main configuration prop", async () => {
      @Component()
      class TestProvider1 {}

      @Component()
      class TestProvider2 {}

      @Configuration()
      class Config1 {
        @Configuration.Component()
        public testProvider1: TestProvider1;
      }

      @Configuration()
      class Config2 {
        @Configuration.Component()
        public testProvider2: TestProvider2;

        @Configuration.Component()
        public config1: Config1;
      }

      const providers = await componentScanner.scan(Config2);
      expect(providers.length).toBe(4);
      expect(providers.find((it) => it.name === "testProvider1")).not.toBeNull();
      expect(providers.find((it) => it.name === "testProvider2")).not.toBeNull();
      expect(providers.find((it) => it.name === "config1")).not.toBeNull();
      expect(providers.find((it) => it.name === "config2")).not.toBeNull();
    });

    test("should scan out providers, when sub config class is nested on main configuration factory method", async () => {
      @Component()
      class TestProvider1 {}

      @Component()
      class TestProvider2 {}

      @Configuration()
      class Config1 {
        @Configuration.Component()
        public testProvider1: TestProvider1;
      }

      @Configuration()
      class Config2 {
        @Configuration.Component()
        public testProvider2: TestProvider2;

        @Configuration.Component()
        public config1(): Config1 {
          return new Config1();
        }
      }

      const providers = await componentScanner.scan(Config2);
      expect(providers.length).toBe(4);
      expect(providers.find((it) => it.name === "testProvider1")).not.toBeNull();
      expect(providers.find((it) => it.name === "testProvider2")).not.toBeNull();
      expect(providers.find((it) => it.name === "config1")).not.toBeNull();
      expect(providers.find((it) => it.name === "config2")).not.toBeNull();
    });
  });

  describe("integrate container、 scanner and injector", () => {
    const componentScanner = new ComponentScanner();
    const [context, container, injector] = createTestAppContext();

    @Component()
    class TestProvider {
      public msg: string;
    }

    test("should load instance", async () => {
      @Configuration()
      class TestConfig {
        @Configuration.Component()
        public testProvider(): TestProvider {
          const test = new TestProvider();
          test.msg = "hello";
          return test;
        }
      }

      const providers = await componentScanner.scan(TestConfig);
      container.addProviders(providers);
      const testProviderWrapper = container.getProvider<TestProvider>("testProvider");
      const testProviderInstance = await injector.loadProvider(testProviderWrapper!);
      expect(testProviderWrapper).not.toBeNull();
      expect(testProviderInstance.msg).not.toBeNull();
    });
  });

  describe("scan out order.", () => {
    const componentScanner = new ComponentScanner();

    test("Should is the same order as defined in configuration class.", async () => {
      @Component()
      class TestProvider {}

      @Configuration()
      class Config {
        @Configuration.Component()
        public provider1: TestProvider;

        @Configuration.Component()
        public provider2: TestProvider;

        @Configuration.Component()
        public provider3: TestProvider;
      }

      const providers = await componentScanner.scan(Config);
      expect(providers[0].type).toBe(Config);
      expect(providers[1].name).toBe("provider1");
      expect(providers[2].name).toBe("provider2");
      expect(providers[3].name).toBe("provider3");
    });

    test("Should is the same order as defined in super configuration class.", async () => {
      @Component()
      class TestProvider {}

      @Configuration()
      class Config {
        @Configuration.Component()
        public provider1: TestProvider;

        @Configuration.Component()
        public provider2: TestProvider;

        @Configuration.Component()
        public provider3: TestProvider;
      }

      @Configuration()
      class Config1 extends Config {
        @Configuration.Component()
        public provider2: TestProvider;

        @Configuration.Component()
        public provider4: TestProvider;
      }

      const providers = await componentScanner.scan(Config1);
      expect(providers[0].type).toBe(Config1);
      expect(providers[1].name).toBe("provider1");
      expect(providers[2].name).toBe("provider2");
      expect(providers[3].name).toBe("provider3");
      expect(providers[4].name).toBe("provider4");
    });

    test("Should is the same order as defined in module.", async () => {
      @Component()
      class TestProvider {}

      const module = {
        provider1: {
          name: "provider1",
          useClass: TestProvider,
          type: TestProvider,
        },
        provider2: {
          name: "provider2",
          useClass: TestProvider,
          type: TestProvider,
        },
        provider3: {
          name: "provider3",
          useClass: TestProvider,
          type: TestProvider,
        },
      };

      const providers = await componentScanner.scan(module);
      expect(providers[0].name).toBe("provider1");
      expect(providers[1].name).toBe("provider2");
      expect(providers[2].name).toBe("provider3");
    });

    test("Should is the same order as defined in module, and then modify module.", async () => {
      @Component()
      class TestProvider {}

      const module = {
        provider1: {
          name: "provider1",
          useClass: TestProvider,
          type: TestProvider,
        },
        provider2: {
          name: "provider2",
          useClass: TestProvider,
          type: TestProvider,
        },
        provider3: {
          name: "provider3",
          useClass: TestProvider,
          type: TestProvider,
        },
      } as any;

      module.provider2 = {
        name: "provider22",
        useClass: TestProvider,
        type: TestProvider,
      };

      module.provider4 = {
        name: "provider4",
        useClass: TestProvider,
        type: TestProvider,
      };

      const providers = await componentScanner.scan(module);
      expect(providers[0].name).toBe("provider1");
      expect(providers[1].name).toBe("provider22");
      expect(providers[2].name).toBe("provider3");
      expect(providers[3].name).toBe("provider4");
    });
  });
});
