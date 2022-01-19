import { ReactRoute } from "./react-route.decorator";
import { ReactController } from "../react-controller.decorator";
import { BaseReactController } from "../base-react-controller";
import React from "react";
import { render } from "@testing-library/react";
import { ReactApplicationFactory } from "../react-application-factory";
import { ReactApplicationConfiguration } from "../react-application.configuration";
import Hello from "./fixtures/router/pages/hello";
import { ReactRouterService } from "./react-router-service";
import { IReactRoute } from "../interfaces";

describe("react-router", () => {
  test("load route component", async () => {
    @ReactRoute({ path: "/hello" })
    @ReactController()
    class HelloController extends BaseReactController {
      renderView() {
        return <div data-testid="hello">Hello</div>;
      }
    }

    const app = await ReactApplicationFactory.create(ReactApplicationConfiguration, undefined, [
      {
        name: "reactRouterProps",
        type: Object,
        useValue: { initialEntries: ["/hello"] },
      },
    ]);

    const reactRouter = await app.get(ReactRouterService);
    reactRouter.addRoute({
      path: "hello",
      componentName: "helloController",
      componentModule: { HelloController },
    } as IReactRoute);

    const appContent = app.start();
    const { getByTestId, container, rerender, getByText } = render(appContent);
    expect(getByTestId("hello").innerHTML).toBe("Hello");
  });

  test("load react controller which embedded in route component. ", async () => {
    @ReactController()
    class MsgController extends BaseReactController {
      renderView() {
        return (
          <div>
            <div data-testid="matchPathname">{this.props.match?.pathname}</div>
            <div data-testid="locationPathname">{this.props.location?.pathname}</div>
            <div data-testid="hello">Hello</div>
          </div>
        );
      }
    }

    @ReactRoute({ path: "/hello" })
    @ReactController()
    class HelloController extends BaseReactController {
      renderView() {
        return (
          <div>
            <MsgController />
          </div>
        );
      }
    }

    const app = await ReactApplicationFactory.create(ReactApplicationConfiguration, undefined, [
      {
        name: "reactRouterProps",
        type: Object,
        useValue: { initialEntries: ["/hello"] },
      },
    ]);

    const reactRouter = await app.get(ReactRouterService);
    reactRouter.addRoute({
      path: "hello",
      componentName: "helloController",
      componentModule: { HelloController },
    } as IReactRoute);

    const appContent = app.start();
    const { getByTestId, container, rerender, getByText } = render(appContent);
    expect(getByTestId("matchPathname").innerHTML).toBe("/hello");
    expect(getByTestId("locationPathname").innerHTML).toBe("/hello");
  });
});
