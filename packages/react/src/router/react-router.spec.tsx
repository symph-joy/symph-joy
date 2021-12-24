import React from "react";
import { render } from "@testing-library/react";
import "reflect-metadata";

import { ReactApplicationConfiguration } from "../react-application.configuration";
import { ReactRouter } from "./react-router";
import DynamicRoutePath from "./fixtures/router/pages/dynamic-route-path";
import { ReactApplicationFactory } from "../react-application-factory";
import Hello from "./fixtures/router/pages/hello";
import NestLayout from "./fixtures/router/pages/nest/layout";
import NestAbc from "./fixtures/router/pages/nest/abc";
import NestIndex from "./fixtures/router/pages/nest";
import NestChildAbc from "./fixtures/router/pages/nest/child/abc";
import CatchAllPage from "./fixtures/router/pages/catch-all-page";

describe("react-router", () => {
  test("should render the hello route", async () => {
    const app = await ReactApplicationFactory.create(ReactApplicationConfiguration, undefined, [
      {
        name: "reactRouterProps",
        type: Object,
        useValue: { initialEntries: ["/hello"] },
      },
      Hello,
    ]);
    // const reactRouter = await app.get(ReactRouter);
    // reactRouter!.setRoutes([
    //   {
    //     path: "/",
    //     component: Main,
    //   },
    // ]);
    const appContent = app.start();
    const { getByTestId, container, rerender, getByText } = render(appContent);
    expect(getByTestId("hello").innerHTML).toBe("Hello");
  });

  test("should render the nesting route.", async () => {
    const app = await ReactApplicationFactory.create(ReactApplicationConfiguration, undefined, [
      {
        name: "reactRouterProps",
        type: Object,
        useValue: { initialEntries: ["/nest/abc"] },
      },
      NestLayout,
      NestAbc,
    ]);
    const reactRouter = await app.get(ReactRouter);
    const appContent = app.start();
    const { getByTestId, container, rerender, getByText } = render(appContent);
    expect(getByTestId("nestLayout").innerHTML).toBe("Nest Layout");
    expect(getByTestId("nestAbc").innerHTML).toBe("Nest Abc");
  });

  test("should render the nesting default index route.", async () => {
    const app = await ReactApplicationFactory.create(ReactApplicationConfiguration, undefined, [
      {
        name: "reactRouterProps",
        type: Object,
        useValue: { initialEntries: ["/nest"] },
      },
      NestLayout,
      NestIndex,
    ]);
    const appContent = app.start();
    const reactRouter = await app.get(ReactRouter);
    const matchedRoutes = reactRouter.getMatchedRoutes("/nest");
    const routes = reactRouter.getRoutes();
    expect(matchedRoutes).toMatchObject([{ path: "/nest" }, { path: "/nest", index: true }]);
    const { getByTestId, container, rerender, getByText } = render(appContent);
    expect(getByTestId("nestLayout").innerHTML).toBe("Nest Layout");
    expect(getByTestId("nestIndex").innerHTML).toBe("Nest Index");
  });

  test("should render the nesting route, and its all child route.", async () => {
    const app = await ReactApplicationFactory.create(ReactApplicationConfiguration, undefined, [
      {
        name: "reactRouterProps",
        type: Object,
        useValue: { initialEntries: ["/nest/child/abc"] },
      },
      NestLayout,
      NestAbc,
      NestIndex,
      NestChildAbc,
    ]);
    const reactRouter = await app.get(ReactRouter);
    const appContent = app.start();
    const { getByTestId, container, rerender, getByText } = render(appContent);
    expect(getByTestId("nestLayout").innerHTML).toBe("Nest Layout");
    expect(getByTestId("nestChildAbc").innerHTML).toBe("Nest Child Abc");
  });

  test("should render the dynamic route, and bind the path param to prop", async () => {
    const app = await ReactApplicationFactory.create(ReactApplicationConfiguration, undefined, [
      {
        name: "reactRouterProps",
        type: Object,
        useValue: { initialEntries: ["/dynamic/joy/100"] },
      },
      DynamicRoutePath,
    ]);
    const appContent = app.start();
    const { getByTestId, container, rerender, getByText } = render(appContent);
    expect(getByTestId("message").innerHTML).toBe("joy");
    expect(getByTestId("count").innerHTML).toBe("100");
    expect(getByTestId("hasCount").innerHTML).toBe("true");
    expect(getByTestId("countTrans").innerHTML).toBe("101");
  });

  test("should render the catch all route", async () => {
    const app = await ReactApplicationFactory.create(ReactApplicationConfiguration, undefined, [
      {
        name: "reactRouterProps",
        type: Object,
        useValue: { initialEntries: ["/catch-all/a/b/c"] },
      },
      CatchAllPage,
    ]);
    const appContent = app.start();
    const { getByTestId, container, rerender, getByText } = render(appContent);
    expect(getByTestId("message").innerHTML).toBe("a/b/c");
  });
});
