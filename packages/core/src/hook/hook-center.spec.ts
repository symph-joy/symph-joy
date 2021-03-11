import { HookType } from "./interface/hook.interface";
import { Hook } from "./hook.decorator";
import { Configuration, Injectable } from "../decorators/core";
import { CoreContext } from "../core-context";
import { Tap } from "./tap.decorator";
import { HookPipe } from "./hook-center";
import { JoyContainer } from "../injector";

describe("hook", () => {
  test("basic usage", async () => {
    @Injectable()
    class APlugin {
      key: string;

      @Hook({ id: "modifyContent", parallel: false, type: HookType.Waterfall })
      public modifyContent: HookPipe;

      public async content() {
        return await this.modifyContent.call("a");
      }
    }

    interface IAPluginHooks {
      modifyContent(mono: string): string;
    }

    @Injectable()
    class BPlugin implements IAPluginHooks {
      key: string;

      @Tap()
      modifyContent(a: string): string {
        console.log("====== modifyContent:", a);
        return a + "-b";
      }
    }

    @Configuration()
    class AppConfig {
      @Configuration.Provider()
      public aPlugin!: APlugin;

      @Configuration.Provider()
      public bPlugin!: BPlugin;
    }

    const container = new JoyContainer();
    const app = new CoreContext(AppConfig, container);
    await app.init();

    const helloProvider = await app.get<APlugin>(APlugin)!;
    expect(await helloProvider.content()).toBe("a-b");
  });
});
