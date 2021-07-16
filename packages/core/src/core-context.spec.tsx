import { Injectable } from "../src/decorators/core";
import React from "react";
import { Configuration } from "./decorators/core/configuration/configuration.decorator";
import { Provider } from "./decorators/core/configuration/provider.decorator";
import { CoreContext } from "./core-context";
import { JoyContainer } from "./injector";
import { Tap } from "./hook";

describe("temp-context", () => {
  test("inject context self", async () => {
    @Injectable()
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

    const container = new JoyContainer();
    const app = new CoreContext(AppConfig, container);
    await app.init();

    const helloProvider = await app.get(HelloProvider);
    expect(helloProvider!.hello()).toBe("hello world");
  });

  test("hook: onContextInitialized", async () => {
    @Injectable()
    class HelloProvider {
      public msg: string;

      @Tap()
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

    const container = new JoyContainer();
    const app = new CoreContext(AppConfig, container);
    await app.init();

    const helloProvider = await app.get(HelloProvider);
    expect(helloProvider.msg).toBe("inited");
  });

  test("loadModule", async () => {
    @Injectable()
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
});
