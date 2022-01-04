import { BaseReactController, ReactController, ReactRoute } from "@symph/react";
import { getPrerenderMeta, Prerender } from "./prerender.decorator";
import { IJoyPrerender } from "./prerender.interface";

describe("prerender", () => {
  test("Should get prerender from controller", async () => {
    @Prerender()
    @ReactRoute({ path: "/hello" })
    @ReactController()
    class HelloController extends BaseReactController {
      renderView(): React.ReactNode {
        return undefined;
      }
    }

    const prerenderMeta = getPrerenderMeta(HelloController);
    expect(prerenderMeta).toMatchObject({ route: "/hello", paths: ["/hello"] });
  });

  test("Should get prerender from Prerender class", async () => {
    @ReactRoute({ path: "/hello/:msg" })
    @ReactController()
    class HelloController extends BaseReactController {
      renderView(): React.ReactNode {
        return undefined;
      }
    }

    @Prerender({ routeComponent: HelloController })
    class PrerenderHello implements IJoyPrerender {
      getPaths(): Promise<Array<string>> {
        return Promise.resolve(["/hello/1", "/hello/2"]);
      }

      isFallback(): Promise<boolean> | boolean {
        return false;
      }
    }

    const prerenderMeta = getPrerenderMeta(PrerenderHello);
    expect(prerenderMeta).toMatchObject({ route: undefined, routeComponent: HelloController });
  });
});
