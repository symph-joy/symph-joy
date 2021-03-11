import React from "react";
import { render } from "@testing-library/react";
import "reflect-metadata";

import Main from "./fixtures/router/pages/main";
import Hello1 from "./fixtures/router/pages/hello1";
import { ReactApplicationConfig } from "../react-application-config";
import { ReactRouter } from "./react-router";
import DynamicRoutePath from "./fixtures/router/pages/dynamic-route-path";
import { SymphReactFactory } from "../symph-react-factory";

describe("react-router", () => {
  test("should render the main route, by special component", async () => {
    const app = await SymphReactFactory.create({
      ReactApplicationConfig,
      reactRouterProps: { type: Object, useValue: { initialEntries: ["/"] } },
      Main: Main,
    });
    const reactRouter = await app.get(ReactRouter);
    reactRouter!.setRoutes([
      {
        path: "/",
        component: Main,
      },
    ]);
    const appContent = app.start();
    const { getByTestId, container, rerender, getByText } = render(appContent);
    expect(getByText("main")).not.toBeNull();
  });

  test("should render the main route, by special providerId", async () => {
    const app = await SymphReactFactory.create({
      ReactApplicationConfig,
      reactRouterProps: { type: Object, useValue: { initialEntries: ["/"] } },
      Main: Main,
    });
    const reactRouter = await app.get(ReactRouter);
    reactRouter!.setRoutes([
      {
        path: "/",
        providerId: "main",
      },
    ]);
    const appContent = app.start();
    const { getByTestId, container, rerender, getByText } = render(appContent);
    expect(getByText("main")).not.toBeNull();
  });

  test("should render the second level route", async () => {
    const app = await SymphReactFactory.create({
      ReactApplicationConfig,
      reactRouterProps: {
        type: Object,
        useValue: { initialEntries: ["/hello1"] },
      },
      Main: Main,
      Hello1: Hello1,
    });
    const reactRouter = await app.get(ReactRouter);
    reactRouter!.setRoutes([
      {
        providerId: "main",
        path: "/",
        routes: [
          {
            providerId: "hello1",
            path: "/hello1",
          },
        ],
      },
    ]);
    const appContent = app.start();
    const { getByTestId, container, rerender, getByText } = render(appContent);
    expect(getByText("main")).not.toBeNull();
    expect(getByText("hello1")).not.toBeNull();
  });

  test("should render the dynamic route, and bind the path param to prop", async () => {
    const app = await SymphReactFactory.create({
      ReactApplicationConfig,
      reactRouterProps: {
        type: Object,
        useValue: { initialEntries: ["/hello/joy/100"] },
      },
      Main: Main,
      Hello1: Hello1,
    });
    const reactRouter = await app.get(ReactRouter);
    reactRouter!.setRoutes([
      {
        path: "/hello/:message/:count",
        component: DynamicRoutePath,
      },
    ]);
    const appContent = app.start();
    const { getByTestId, container, rerender, getByText } = render(appContent);
    expect(getByTestId("message").innerHTML).toBe("joy");
    expect(getByTestId("count").innerHTML).toBe("100");
    expect(getByTestId("hasCount").innerHTML).toBe("true");
    expect(getByTestId("countTrans").innerHTML).toBe("101");
  });
});
