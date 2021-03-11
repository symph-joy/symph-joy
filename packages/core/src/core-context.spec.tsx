import { Injectable } from "../src/decorators/core";
import React from "react";
import { Configuration } from "./decorators/core/configuration/configuration.decorator";
import { Provider } from "./decorators/core/configuration/provider.decorator";
import { CoreContext } from "./core-context";
import { JoyContainer } from "./injector";

describe("temp-context", () => {
  test("aware context self", async () => {
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
});
