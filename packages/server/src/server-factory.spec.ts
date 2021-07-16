import { ServerFactory } from "./server-factory";
import { Configuration, Injectable } from "@symph/core";
import { ServerProvidersConfig } from "./server-providers-config";
import { Controller, Get } from "./decorators";

describe("server-factory", () => {
  test("createServer", async () => {
    // @Injectable()
    // class HelloProvider {
    //   private message = "hello world";
    //   hello() {
    //     return this.message;
    //   }
    // }

    @Controller("aa")
    class HelloController {
      @Get("bb")
      hello1(): string {
        return "hello joy bb";
      }

      @Get("cc")
      hello2(): string {
        return "hello joy cc";
      }
    }

    @Configuration()
    class AppConfig {
      // @Configuration.Provider()
      // public helloProvider: HelloProvider;

      @Configuration.Provider()
      public helloController: HelloController;
    }

    // const app = await ServerFactory.createServer({ServerProvidersConfig, AppConfig});
    const app = await ServerFactory.create({ AppConfig });
    // const helloProvider = await app.get(HelloProvider);
    await app.listen(5000);
    await new Promise((resolve) => setTimeout(resolve, 10000000));

    // expect(helloProvider!.hello()).toBe("hello world");
  }, 99999999);
});
