import React from "react";
import { Configuration } from "./decorators/core/configuration/configuration.decorator";
import { Provider } from "./decorators/core/configuration/provider.decorator";
import { CoreContext } from "./core-context";
import { ComponentWrapper, CoreContainer } from "./injector";
import { RegisterTap } from "./hook";
import { TProviderName } from "./interfaces";
import { Component } from "./decorators";
import { IApplicationContextAware } from "./interfaces/context/application-context-ware.interface";

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
    const app = new CoreContext(AppConfig);
    await app.init();

    const helloProvider = await app.get(HelloProvider);
    expect(helloProvider!.hello()).toBe("hello world");
  });

  describe("application context aware", () => {
    it("should set application context to component.", async () => {
      @Component()
      class MyProvider implements IApplicationContextAware {
        public context: CoreContext;
        setApplicationContext(coreContext: CoreContext): void {
          this.context = coreContext;
        }
      }

      const container = new CoreContainer();
      const app = new CoreContext([MyProvider]);
      await app.init();
      const myProvider = await app.get(MyProvider);
      expect(myProvider!.context).toBeInstanceOf(CoreContext);
    });
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
    test("onModuleAfterLoad", async () => {
      @Component()
      class HelloProvider {
        public allProviderNames: TProviderName[] = [];

        @RegisterTap()
        async onModuleAfterLoad(modules: any, instanceWrappers: ComponentWrapper[]) {
          return new Promise<void>((resolve) => {
            setTimeout(() => {
              instanceWrappers.forEach((it) => {
                this.allProviderNames.push(it.name);
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

      const app = new CoreContext();
      await app.init();
      await app.loadModule(AppConfig);

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
      const app = new CoreContext(AppConfig);
      await app.init();

      const helloProvider = await app.get(HelloProvider);
      expect(helloProvider.msg).toBe("inited");
    });
  });
});
