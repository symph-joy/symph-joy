import React from "react";
import { Configuration } from "./decorators/core/configuration/configuration.decorator";
import { Provider } from "./decorators/core/configuration/provider.decorator";
import { CoreContext } from "./core-context";
import { ComponentWrapper, CoreContainer } from "./injector";
import { RegisterTap } from "./hook";
import { TProviderName } from "./interfaces";
import { Component } from "./decorators";

describe("core-context", () => {
  test("inject context self", async () => {
    @Component()
    class HelloProvider {
      private message = "hello world";

      constructor(private context: CoreContext) {}

      hello() {
        return this.message;
      }
    }

    @Configuration()
    class AppConfig {
      @Provider()
      public helloProvider: HelloProvider;
    }

    const container = new CoreContainer();
    const app = new CoreContext(AppConfig, container);
    await app.init();

    const helloProvider = await app.get(HelloProvider);
    expect(helloProvider!.hello()).toBe("hello world");
  });

  test("loadModule", async () => {
    @Component()
    class HelloProvider {
      private message = "hello world";

      constructor(private context: CoreContext) {}

      hello() {
        return this.message;
      }
    }

    @Configuration()
    class AppConfig {
      @Provider()
      public helloProvider: HelloProvider;
    }

    const app = new CoreContext({});
    await app.init();
    await app.loadModule(AppConfig);

    const helloProvider = await app.get(HelloProvider);
    expect(helloProvider!.hello()).toBe("hello world");
  });

  describe("context hooks", () => {
    test("onDidProvidersRegister", async () => {
      @Component()
      class HelloProvider {
        public allProviderNames: TProviderName[] = [];

        @RegisterTap()
        async onDidProvidersRegister(instanceWrappers: ComponentWrapper[]) {
          return new Promise<void>((resolve) => {
            setTimeout(() => {
              instanceWrappers.forEach((it) => {
                this.allProviderNames.push(...it.name);
              });

              resolve();
            }, 50);
          });
        }
      }

      @Configuration()
      class AppConfig {
        @Provider()
        public helloProvider: HelloProvider;
      }

      const container = new CoreContainer();
      const app = new CoreContext(AppConfig, container);
      await app.init();

      const helloProvider = await app.get(HelloProvider);
      expect(helloProvider.allProviderNames).toContain("helloProvider");
      expect(helloProvider.allProviderNames).toContain("appConfig");
    });

    test("onContextInitialized", async () => {
      @Component()
      class HelloProvider {
        public msg: string;

        @RegisterTap()
        async onContextInitialized() {
          return new Promise<void>((resolve) => {
            setTimeout(() => {
              this.msg = "inited";
              resolve();
            }, 50);
          });
        }
      }

      @Configuration()
      class AppConfig {
        @Provider()
        public helloProvider: HelloProvider;
      }

      const container = new CoreContainer();
      const app = new CoreContext(AppConfig, container);
      await app.init();

      const helloProvider = await app.get(HelloProvider);
      expect(helloProvider.msg).toBe("inited");
    });
  });
});
