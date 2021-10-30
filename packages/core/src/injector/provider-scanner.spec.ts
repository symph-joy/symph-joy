import "reflect-metadata";
import { ProviderScanner } from "./provider-scanner";
import { Configuration } from "../decorators/core/configuration/configuration.decorator";
import { Provider } from "../decorators/core/configuration/provider.decorator";
import { Autowire, Component, Optional } from "../decorators/core";
import { Scope } from "../interfaces";
import { CoreContainer } from "./index";
import { Injector } from "./injector";
import { HookCenter } from "../hook/hook-center";
import { InjectCustomOptionsInterface } from "../interfaces/inject-custom-options.interface";
import { object } from "prop-types";

function instanceContainer(): CoreContainer {
  const container = new CoreContainer();
  const hookCenter = new HookCenter();
  hookCenter.registerProviderHooks(container);
  return container;
}

describe("provider-scanner", () => {
  describe("scan configuration class", () => {
    const container = new CoreContainer();
    const providerScanner = new ProviderScanner();

    @Component()
    class TestProvider {
      public msg: string;
    }

    test("should scan out a class provider", async () => {
      @Configuration()
      class TestConfig {
        public prop1 = "value1";

        @Provider()
        public testProvider: TestProvider;
      }

      const providers = await providerScanner.scanForConfig(TestConfig);
      expect(providers && providers.length).toBe(2);
      const testProvider = providers[1];
      expect(testProvider).toMatchObject({
        name: "testProvider",
        useClass: TestProvider,
        type: TestProvider,
        scope: Scope.DEFAULT,
      });
    });

    test("should scan out a factory provider", async () => {
      @Configuration()
      class TestConfig {
        @Provider()
        public factoryProvider(): TestProvider {
          const p = new TestProvider();
          p.msg = "from factoryProvider 1";
          return p;
        }
      }

      const providers = await providerScanner.scanForConfig(TestConfig);
      expect(providers && providers.length).toBe(2);
      const factoryProvider = providers[1];
      expect(factoryProvider).toMatchObject({
        name: "factoryProvider",
        useFactory: { factory: TestConfig, property: "factoryProvider" },
        inject: [],
        type: TestProvider,
        scope: Scope.DEFAULT,
      });
    });

    test("should scan out a factory provider，with custom inject param", async () => {
      @Configuration()
      class TestConfig {
        @Provider()
        public factoryProvider(@Autowire("initValue") initValue: string): TestProvider {
          const p = new TestProvider();
          p.msg = initValue;
          return p;
        }
      }

      const providers = await providerScanner.scanForConfig(TestConfig);
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
        scope: Scope.DEFAULT,
      });
    });

    test("should scan out a factory provider，with optional param", async () => {
      @Configuration()
      class TestConfig {
        @Provider()
        public factoryProvider(@Optional() @Autowire("initValue") initValue: string): TestProvider {
          const p = new TestProvider();
          p.msg = initValue;
          return p;
        }
      }

      const providers = await providerScanner.scanForConfig(TestConfig);
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
        scope: Scope.DEFAULT,
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

      const providers = await providerScanner.scan(valueProvider);
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
        @Provider({
          name: "testProvider1",
          scope: Scope.TRANSIENT,
        })
        public testProvider: TestProvider;
      }

      const providers = await providerScanner.scanForConfig(TestConfig);
      expect(providers && providers.length).toBe(2);
      const testProvider1 = providers[1];
      expect(testProvider1).toMatchObject({
        name: "testProvider1",
        useClass: TestProvider,
        scope: Scope.TRANSIENT,
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
        @Provider()
        public testProvider: TestProvider;
      }

      @Configuration()
      class ExtendConfig extends TestConfig {
        @Provider()
        public extendTestProvider: TestProvider1;
      }

      const providers = await providerScanner.scanForConfig(ExtendConfig);
      const testProvider = providers.find((v) => v.name === "testProvider");
      const extendTestProvider = providers.find((v) => v.name === "extendTestProvider");
      expect(testProvider).toMatchObject({
        name: "testProvider",
        useClass: TestProvider,
        type: TestProvider,
        scope: Scope.DEFAULT,
      });
      expect(extendTestProvider).toMatchObject({
        name: "extendTestProvider",
        useClass: TestProvider1,
        type: TestProvider1,
        scope: Scope.DEFAULT,
      });
    });

    test("should override provider defines by child configuration class", async () => {
      @Component()
      class TestProvider1 {
        public msg: string;
      }

      @Configuration()
      class TestConfig {
        @Provider()
        public testProvider: TestProvider;
      }

      @Component()
      class TestProvider2 extends TestProvider1 {
        public msg: string;
      }

      @Configuration()
      class ExtendConfig extends TestConfig {
        @Provider()
        public testProvider: TestProvider2;
      }

      const providers = await providerScanner.scanForConfig(ExtendConfig);
      const testProvider = providers.find((v) => v.name === "testProvider");

      expect(testProvider).toMatchObject({
        name: "testProvider",
        useClass: TestProvider2,
        type: TestProvider2,
        scope: Scope.DEFAULT,
      });
    });
  });

  describe("scan module exports", () => {
    const container1 = instanceContainer();
    const providerScanner = new ProviderScanner();

    @Component({ scope: Scope.TRANSIENT })
    class TestProvider {
      public msg: string;
    }

    test("should scan out a class provider", async () => {
      const exports = {
        TestProvider,
      };
      const providers = await providerScanner.scan(exports);
      container1.addProviders(providers);
      expect(providers && providers.length).toBe(1);
      const testProvider = providers[0];
      expect(testProvider).toMatchObject({
        name: "testProvider",
        useClass: TestProvider,
        type: TestProvider,
        scope: Scope.TRANSIENT,
        lazyRegister: false,
      });
    });

    test("should scan out providers", async () => {
      @Configuration()
      class TestConfig {
        @Provider()
        public testProvider1: TestProvider;
      }

      const exports = {
        TestProvider,
        TestConfig,
      };
      const providers = await providerScanner.scan(exports);
      container1.addProviders(providers);
      expect(providers && providers.length).toBe(3);
      const testProvider = providers.find((it) => it.name === "testProvider");
      const testProvider1 = providers.find((it) => it.name === "testProvider1");
      expect(testProvider).toMatchObject({
        name: "testProvider",
        useClass: TestProvider,
        type: TestProvider,
        scope: Scope.TRANSIENT,
        lazyRegister: false,
      });
      expect(testProvider1).toMatchObject({
        name: "testProvider1",
        useClass: TestProvider,
        type: TestProvider,
        scope: Scope.DEFAULT,
      });
    });
  });

  describe("scan imports", () => {
    const container = new CoreContainer();
    const providerScanner = new ProviderScanner();

    test("should scan cover the imports modules", async () => {
      @Component()
      class TestProvider {
        public msg: string;
      }

      @Configuration()
      class DepConfig {
        @Provider()
        public testProvider: TestProvider;
      }

      @Configuration({ imports: { DepConfig } })
      class Main {}

      const providers = await providerScanner.scan(Main);
      const testProvider = providers.find((v) => v.name === "testProvider");
      expect(testProvider).not.toBeNull();
    });
  });

  describe("scan an array entry", () => {
    const container = new CoreContainer();
    const providerScanner = new ProviderScanner();

    test("should scan out providers in all array items", async () => {
      @Component()
      class TestProvider1 {}

      @Component()
      class TestProvider2 {}

      @Configuration()
      class DepConfig {
        @Provider()
        public testProvider2: TestProvider2;
      }

      const providers = await providerScanner.scan([TestProvider1, DepConfig]);
      expect(providers.length).toBe(3);
    });
  });

  describe("scan nest config", () => {
    const container = new CoreContainer();
    const providerScanner = new ProviderScanner();

    test("should scan out providers, when config class is nested in object", async () => {
      @Component()
      class TestProvider1 {}

      @Component()
      class TestProvider2 {}

      @Configuration()
      class Config1 {
        @Provider()
        public testProvider2: TestProvider2;
      }

      const providers = await providerScanner.scan({ TestProvider1, Config1 });
      expect(providers.length).toBe(3);
    });

    test("should scan out providers, when sub config class is nested on main configuration prop", async () => {
      @Component()
      class TestProvider1 {}

      @Component()
      class TestProvider2 {}

      @Configuration()
      class Config1 {
        @Provider()
        public testProvider1: TestProvider1;
      }

      @Configuration()
      class Config2 {
        @Provider()
        public testProvider2: TestProvider2;

        @Provider()
        public config1: Config1;
      }

      const providers = await providerScanner.scan(Config2);
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
        @Provider()
        public testProvider1: TestProvider1;
      }

      @Configuration()
      class Config2 {
        @Provider()
        public testProvider2: TestProvider2;

        @Provider()
        public config1(): Config1 {
          return new Config1();
        }
      }

      const providers = await providerScanner.scan(Config2);
      expect(providers.length).toBe(4);
      expect(providers.find((it) => it.name === "testProvider1")).not.toBeNull();
      expect(providers.find((it) => it.name === "testProvider2")).not.toBeNull();
      expect(providers.find((it) => it.name === "config1")).not.toBeNull();
      expect(providers.find((it) => it.name === "config2")).not.toBeNull();
    });
  });

  describe("integrate container、 scanner and injector", () => {
    const container = instanceContainer();
    const providerScanner = new ProviderScanner();
    const pluginCenter = new HookCenter();
    const injector = new Injector(pluginCenter);

    @Component()
    class TestProvider {
      public msg: string;
    }

    test("should load instance", async () => {
      @Configuration()
      class TestConfig {
        @Provider()
        public testProvider(): TestProvider {
          const test = new TestProvider();
          test.msg = "hello";
          return test;
        }
      }

      const providers = await providerScanner.scan(TestConfig);
      container.addProviders(providers);
      const testProviderWrapper = container.getProvider<TestProvider>("testProvider");
      const testProviderInstance = await injector.loadProvider(testProviderWrapper!, container);
      expect(testProviderWrapper).not.toBeNull();
      expect(testProviderInstance.msg).not.toBeNull();
    });
  });

  describe("scan out order.", () => {
    const providerScanner = new ProviderScanner();

    test("Should is the same order as defined in configuration class.", async () => {
      @Component()
      class TestProvider {}

      @Configuration()
      class Config {
        @Provider()
        public provider1: TestProvider;

        @Provider()
        public provider2: TestProvider;

        @Provider()
        public provider3: TestProvider;
      }

      const providers = await providerScanner.scan(Config);
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
        @Provider()
        public provider1: TestProvider;

        @Provider()
        public provider2: TestProvider;

        @Provider()
        public provider3: TestProvider;
      }

      @Configuration()
      class Config1 extends Config {
        @Provider()
        public provider2: TestProvider;

        @Provider()
        public provider4: TestProvider;
      }

      const providers = await providerScanner.scan(Config1);
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

      const providers = await providerScanner.scan(module);
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

      const providers = await providerScanner.scan(module);
      expect(providers[0].name).toBe("provider1");
      expect(providers[1].name).toBe("provider22");
      expect(providers[2].name).toBe("provider3");
      expect(providers[3].name).toBe("provider4");
    });
  });
});
