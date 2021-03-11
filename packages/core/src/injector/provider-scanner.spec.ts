import "reflect-metadata";
import { ProviderScanner } from "./provider-scanner";
import { Configuration } from "../decorators/core/configuration/configuration.decorator";
import { Provider } from "../decorators/core/configuration/provider.decorator";
import { Injectable } from "../decorators/core";
import { Scope } from "../interfaces";
import { JoyContainer } from "./index";
import { Injector } from "./injector";
import { HookCenter } from "../hook/hook-center";

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
        useFactory: TestConfig.prototype.factoryProvider,
        inject: [],
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
        autoReg: false,
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
      expect(providers && providers.length).toBe(2);
      const testProvider = providers[0];
      const testProvider1 = providers[1];
      expect(testProvider).toEqual({
        id: "testProvider",
        useClass: TestProvider,
        type: TestProvider,
        scope: Scope.TRANSIENT,
        autoReg: false,
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

      @Configuration({ imports: [DepConfig] })
      class Main {}
      const providers = await providerScanner.scan(Main);
      const testProvider = providers.find((v) => v.id === "testProvider");
      expect(testProvider).not.toBeNull();
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
