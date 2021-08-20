import { CoreContextFactory } from "./core-context-factory";
import { Component } from "../src/decorators/core";
import React from "react";
import { Configuration } from "./decorators/core/configuration/configuration.decorator";
import { Provider } from "./decorators/core/configuration/provider.decorator";

describe("temp-factory", () => {
  test("create", async () => {
    @Component()
    class HelloProvider {
      private message = "hello world";
      hello() {
        return this.message;
      }
    }

    @Configuration()
    class AppConfig {
      @Provider()
      public helloProvider: HelloProvider;
    }

    const app = await CoreContextFactory.createApplicationContext(AppConfig);
    const helloProvider = await app.get(HelloProvider);
    expect(helloProvider!.hello()).toBe("hello world");
  });
});
