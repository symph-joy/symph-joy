import { Configuration, Component } from "@symph/core";

import { JoyBoot } from "./joy-boot";
import { Command } from "./command/command.decorator";
import { ServerFactory } from "@symph/server";
import { JoyBootFactory } from "./joy-boot-factory";

describe("joy", () => {
  test("JoyBoot is a container", async () => {
    @Component()
    class HelloProvider {
      @Command()
      sayHello({ message }: any) {
        return `hello ${message}`;
      }
    }

    @Configuration()
    class AppProvidersConfig {
      @Configuration.Provider()
      public helloProvider!: HelloProvider;
    }

    // const app = new JoyBoot(AppProvidersConfig);
    const app = await JoyBootFactory.createServer({});
    await app.init();

    expect(await app.runCommand("sayHello", { message: "joy" })).toBe("hello joy");
  });
});
