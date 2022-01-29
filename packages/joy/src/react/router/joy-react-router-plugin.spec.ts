import React from "react";
import { handlebars } from "../../lib/handlebars";
import { JoyReactRouterPlugin } from "./joy-react-router-plugin";
import { JoyAppConfig } from "../../joy-server/server/joy-app-config";
import { BaseReactController, ReactController } from "@symph/react";
import { Outlet } from "@symph/react/router-dom";

@ReactController()
class EmptyController extends BaseReactController {
  renderView(): React.ReactNode {
    return React.createElement(Outlet);
  }
}

describe("joy-react-router.service", () => {
  describe("fs route", () => {
    test("Should  fs route", async () => {
      const joyConfig = new JoyAppConfig();
      joyConfig.pagesDir = "/pages";
      const joyReactRouter = new JoyReactRouterPlugin(joyConfig);
      joyReactRouter.addFSRoute("/pages/_layout.tsx", { name: "mainLayout", useClass: EmptyController, type: Object });
      joyReactRouter.addFSRoute("/pages/index.tsx", { name: "mainIndex", useClass: EmptyController, type: Object });

      const routes = joyReactRouter.getRoutes();
      console.log(routes);
      expect(routes).toMatchObject([
        {
          path: "/",
          isContainer: true,
          componentName: "mainLayout",
          children: [
            {
              path: "/",
              index: true,
              componentName: "mainIndex",
            },
          ],
        },
      ]);
    });
  });

  test("handlebars render with windows path", async () => {
    const temp = handlebars.compile("{{json winPath}}");
    const data = {
      winPath: "C:\\a\\.b",
    };
    const str = temp(data);
    console.log(str);
    expect(str).toBe('"C:\\\\a\\\\.b"');
  });
});
