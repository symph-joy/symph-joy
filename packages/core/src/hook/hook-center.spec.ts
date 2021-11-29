import { HookType, IHook } from "./interface/hook.interface";
import { AutowireHook } from "./autowire-hook.decorator";
import { Configuration, Component } from "../decorators/core";
import { ApplicationContext } from "../application-context";
import { RegisterTap } from "./register-tap.decorator";
import { ApplicationContainer } from "../injector";

describe("hook", () => {
  test("basic usage", async () => {
    @Component()
    class APlugin {
      key: string;

      @AutowireHook({ id: "modifyContent", parallel: false, type: HookType.Waterfall })
      public modifyContent: IHook;

      public async content() {
        return await this.modifyContent.call("a");
      }
    }

    interface IAPluginHooks {
      modifyContent(mono: string): string;
    }

    @Component()
    class BPlugin implements IAPluginHooks {
      key: string;

      @RegisterTap()
      modifyContent(a: string): string {
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

    const app = new ApplicationContext(AppConfig);
    await app.init();

    const helloProvider = await app.get<APlugin>(APlugin)!;
    expect(await helloProvider.content()).toBe("a-b");
  });

  test("Should override the tap method by child class.", async () => {
    @Component()
    class APlugin {
      key: string;

      @AutowireHook({ parallel: false, type: HookType.Waterfall })
      public ahook: IHook;

      public async content() {
        return await this.ahook.call("a");
      }
    }

    @Component()
    class BPlugin {
      key: string;

      @RegisterTap()
      ahook(a: string): string {
        return a + "-b";
      }
    }

    @Component()
    class CPlugin extends BPlugin {
      key: string;

      @RegisterTap()
      ahook(a: string): string {
        return a + "-c";
      }
    }

    @Configuration()
    class AppConfig {
      @Configuration.Provider()
      public aPlugin: APlugin;

      // @Configuration.Provider()
      // public bPlugin: BPlugin;

      @Configuration.Provider()
      public cPlugin: CPlugin;
    }

    const app = new ApplicationContext(AppConfig);
    await app.init();

    const helloProvider = await app.get<APlugin>(APlugin)!;
    expect(await helloProvider.content()).toBe("a-c");
  });
});
