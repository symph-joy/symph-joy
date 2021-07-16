import "reflect-metadata";
import { ProviderScanner } from "./provider-scanner";
import { Configuration } from "../decorators/core/configuration/configuration.decorator";
import { Provider } from "../decorators/core/configuration/provider.decorator";
import { Inject, Injectable, Optional } from "../decorators/core";
import { Scope } from "../interfaces";
import { JoyContainer } from "./index";
import { Injector } from "./injector";
import { HookCenter } from "../hook/hook-center";
import { InjectCustomOptionsInterface } from "../interfaces/inject-custom-options.interface";

function instanceContainer(): JoyContainer {
  const container = new JoyContainer();
  const hookCenter = new HookCenter();
  hookCenter.registerProviderHooks(container, JoyContainer);
  return container;
}

describe("provider-scanner", () => {
  describe("scan configuration class", () => {
    const container = new JoyContainer();
    const providerScanner = new ProviderScanner(container);

    @Injectable()
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
      expect(providers && providers.length).toBe(1);
      const testProvider = providers[0];
      expect(testProvider).toEqual({
        id: "testProvider",
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
      expect(providers && providers.length).toBe(1);
      const factoryProvider = providers[0];
      expect(factoryProvider).toEqual({
        id: "factoryProvider",
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
        public factoryProvider(
          @Inject("initValue") initValue: string
        ): TestProvider {
          const p = new TestProvider();
          p.msg = initValue;
          return p;
        }
      }

      const providers = await providerScanner.scanForConfig(TestConfig);
      expect(providers && providers.length).toBe(1);
      const factoryProvider = providers[0];
      expect(factoryProvider).toEqual({
        id: "factoryProvider",
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
        public factoryProvider(
          @Optional() @Inject("initValue") initValue: string
        ): TestProvider {
          const p = new TestProvider();
          p.msg = initValue;
          return p;
        }
      }

      const providers = await providerScanner.scanForConfig(TestConfig);
      expect(providers && providers.length).toBe(1);
      const factoryProvider = providers[0];
      expect(factoryProvider).toEqual({
        id: "factoryProvider",
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
      @Configuration()
      class TestConfig {
        @Provider({ useValue: "hello" })
        public valueProvider: string;
      }

      const providers = await providerScanner.scanForConfig(TestConfig);
      expect(providers && providers.length).toBe(1);
      const provider = providers[0];
      expect(provider).toEqual({
        id: "valueProvider",
        useValue: "hello",
        type: String,
        scope: Scope.DEFAULT,
      });
    });

    test("should scan out a provider, with meta data", async () => {
      @Configuration()
      class TestConfig {
        @Provider({
          id: "testProvider1",
          useClass: TestProvider,
          scope: Scope.TRANSIENT,
        })
        public testProvider: TestProvider;
      }

      const providers = await providerScanner.scanForConfig(TestConfig);
      expect(providers && providers.length).toBe(1);
      const testProvider1 = providers[0];
      expect(testProvider1).toEqual({
        id: "testProvider1",
        useClass: TestProvider,
        scope: Scope.TRANSIENT,
        type: TestProvider,
      });
    });

    test("should scan out providers from super configuration class", async () => {
      @Injectable()
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
      const testProvider = providers.find((v) => v.id === "testProvider");
      const extendTestProvider = providers.find(
        (v) => v.id === "extendTestProvider"
      );
      expect(testProvider).toEqual({
        id: "testProvider",
        useClass: TestProvider,
        type: TestProvider,
        scope: Scope.DEFAULT,
      });
      expect(extendTestProvider).toEqual({
        id: "extendTestProvider",
        useClass: TestProvider1,
        type: TestProvider1,
        scope: Scope.DEFAULT,
      });
    });
  });

  describe("scan module exports", () => {
    const container1 = instanceContainer();
    const providerScanner = new ProviderScanner(container1);

    @Injectable({ scope: Scope.TRANSIENT })
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
      expect(testProvider).toEqual({
        id: "testProvider",
        useClass: TestProvider,
        type: TestProvider,
        scope: Scope.TRANSIENT,
        autoLoad: false,
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
      const testProvider = providers.find((it) => it.id === "testProvider");
      const testProvider1 = providers.find((it) => it.id === "testProvider1");
      expect(testProvider).toEqual({
        id: "testProvider",
        useClass: TestProvider,
        type: TestProvider,
        scope: Scope.TRANSIENT,
        autoLoad: false,
      });
      expect(testProvider1).toEqual({
        id: "testProvider1",
        useClass: TestProvider,
        type: TestProvider,
        scope: Scope.DEFAULT,
      });
    });
  });

  describe("scan imports", () => {
    const container = new JoyContainer();
    const providerScanner = new ProviderScanner(container);

    test("should scan cover the imports modules", async () => {
      @Injectable()
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
      const testProvider = providers.find((v) => v.id === "testProvider");
      expect(testProvider).not.toBeNull();
    });
  });

  describe("scan an array entry", () => {
    const container = new JoyContainer();
    const providerScanner = new ProviderScanner(container);

    test("should scan out providers in all array items", async () => {
      @Injectable()
      class TestProvider1 {}

      @Injectable()
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
    const container = new JoyContainer();
    const providerScanner = new ProviderScanner(container);

    test("should scan out providers, when config class is nested in object", async () => {
      @Injectable()
      class TestProvider1 {}

      @Injectable()
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
      @Injectable()
      class TestProvider1 {}

      @Injectable()
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
      expect(providers.find((it) => it.id === "testProvider1")).not.toBeNull();
      expect(providers.find((it) => it.id === "testProvider2")).not.toBeNull();
      expect(providers.find((it) => it.id === "config1")).not.toBeNull();
      expect(providers.find((it) => it.id === "config2")).not.toBeNull();
    });

    test("should scan out providers, when sub config class is nested on main configuration factory method", async () => {
      @Injectable()
      class TestProvider1 {}

      @Injectable()
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
      expect(providers.find((it) => it.id === "testProvider1")).not.toBeNull();
      expect(providers.find((it) => it.id === "testProvider2")).not.toBeNull();
      expect(providers.find((it) => it.id === "config1")).not.toBeNull();
      expect(providers.find((it) => it.id === "config2")).not.toBeNull();
    });
  });

  describe("integrate container、 scanner and injector", () => {
    const container = instanceContainer();
    const providerScanner = new ProviderScanner(container);
    const pluginCenter = new HookCenter();
    const injector = new Injector(pluginCenter);

    @Injectable()
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
      const testProviderWrapper = container.getProvider<TestProvider>(
        "testProvider"
      );
      const testProviderInstance = await injector.loadProvider(
        testProviderWrapper!,
        container
      );
      expect(testProviderWrapper).not.toBeNull();
      expect(testProviderInstance.msg).not.toBeNull();
    });
  });
});
