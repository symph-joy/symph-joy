import { TempoFactory } from "../src/tempo-factory";
import { Injectable } from "../src/decorators/core";
import React from "react";
import { Configuration } from "./decorators/core/configuration.decorator";
import { Provider } from "./decorators/core/provider.decorator";

describe("temp-factory", () => {
  test("create", async () => {
    @Injectable()
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

    const app = await TempoFactory.create(AppConfig);
    const helloProvider = await app.get(HelloProvider);
    expect(helloProvider.hello()).toBe("hello world");
  });
});
