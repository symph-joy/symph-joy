import React from "react";
import { render } from "@testing-library/react";
import { ReactController } from "./react-controller.decorator";
import { BaseReactController } from "./base-react-controller";
import { ReactApplicationFactory } from "./react-application-factory";
import { ReactApplicationConfiguration } from "./react-application.configuration";
import { ReactRouterService } from "./router/react-router-service";
import { IReactRoute } from "./interfaces";
import { ReactApplicationContext } from "./react-application-context";
import { ReactAppInitManager, ReactRouteInitStatus } from "./react-app-init-manager";
import { EnumReactAppInitStage } from "./react-app-init-stage.enum";
import { ReactModel } from "./react-model.decorator";
import { BaseReactModel } from "./base-react-model";
import { waitForMoment } from "@symph/server/test/utils/joy-test-utils";
import { renderToStaticMarkup } from "react-dom/server";
import { ReactReduxService } from "./redux/react-redux.service";
import { Outlet } from "./router/react-router-dom";
import { Inject } from "@symph/core";
import { AnyAction } from "./redux";

async function startAppWithRoute(routes: IReactRoute[] = [], initRenderPathname: string): Promise<ReactApplicationContext> {
  const app = await ReactApplicationFactory.create(ReactApplicationConfiguration, undefined, [
    {
      name: "reactRouterProps",
      type: Object,
      useValue: { initialEntries: [initRenderPathname] },
    },
  ]);

  const reactRouter = await app.get(ReactRouterService);
  reactRouter.setRoutes(routes);
  // for (const route of routes) {
  //   reactRouter.addRoute(route);
  // }

  return app;
}

describe("react-app-init-manager", () => {
  test("Should init model static state.", async () => {
    const app = await startAppWithRoute(
      [
        {
          path: "/hello",
          componentName: "helloController",
          componentModule: { HelloController },
        } as IReactRoute,
      ],
      "/hello"
    );
    const initManager = app.getSync(ReactAppInitManager);
    initManager.initStage = EnumReactAppInitStage.STATIC;
    const appContent = app.start();
    const { getByTestId, container, rerender, getByText } = render(appContent);
    expect(getByTestId("helloMsg").innerHTML).toBe("Static Hello");
    await initManager.initControllers("/hello");
    const initState = initManager.getRouteInitState("/hello");
    expect(initState).toMatchObject({
      initStatic: ReactRouteInitStatus.SUCCESS,
    });
    expect(initState.init).toBeUndefined();
  });

  test("Should init model static and dynamic state.", async () => {
    const app = await startAppWithRoute(
      [
        {
          path: "hello",
          componentName: "helloController",
          componentModule: { HelloController },
        } as IReactRoute,
      ],
      "/hello"
    );
    const initManager = app.getSync(ReactAppInitManager);
    initManager.initStage = EnumReactAppInitStage.DYNAMIC;
    const appContent = app.start();
    const { getByTestId, container, rerender, getByText } = render(appContent);
    await waitForMoment(50);
    expect(getByTestId("helloMsg").innerHTML).toBe("Dynamic Hello");
    const initState = initManager.getRouteInitState("/hello");
    expect(initState).toMatchObject({
      initStatic: ReactRouteInitStatus.SUCCESS,
      init: ReactRouteInitStatus.SUCCESS,
    });
  });

  test("Should init all controllers in route component.", async () => {
    @ReactController()
    class LayoutController extends BaseReactController {
      state = {
        msg: "Init Layout Msg",
      };
      async initialModelStaticState(): Promise<void | number> {
        this.setState({
          msg: "Static Layout",
        });
      }

      renderView() {
        return (
          <div>
            <div data-testid="layoutMsg">{this.state.msg}</div>
            <HelloController />
          </div>
        );
      }
    }

    const app = await startAppWithRoute(
      [
        {
          path: "/hello",
          componentName: "layoutController",
          componentModule: { LayoutController },
        } as IReactRoute,
      ],
      "/hello"
    );
    const appContent = app.start();
    const initManager = app.getSync(ReactAppInitManager);
    const { getByTestId, container, rerender, getByText } = render(appContent);
    await initManager.initControllers("/hello");
    expect(getByTestId("layoutMsg").innerHTML).toBe("Static Layout");
    expect(getByTestId("helloMsg").innerHTML).toBe("Dynamic Hello");
    const initState = initManager.getRouteInitState("/hello");
    expect(initState).toMatchObject({
      initStatic: ReactRouteInitStatus.SUCCESS,
      init: ReactRouteInitStatus.SUCCESS,
    });
  });

  test("Should init route tree, and get init route data", async () => {
    @ReactController()
    class LayoutParentController extends BaseReactController {
      @Inject("parentHelloModel")
      private parentHelloModel: HelloModel;

      async initialModelStaticState(): Promise<void | number> {
        await this.parentHelloModel.setMsg("From parent initialModelStaticState");
      }

      renderView() {
        return (
          <div>
            <div data-testid="parentMsg">{this.parentHelloModel.state.msg}</div>
            <Outlet />
          </div>
        );
      }
    }

    @ReactController()
    class LayoutChildController extends BaseReactController {
      @Inject("childHelloModel")
      private childHelloModel: HelloModel;

      async initialModelStaticState(): Promise<void | number> {
        await this.childHelloModel.setMsg("From child initialModelStaticState");
      }

      renderView() {
        return (
          <div>
            <div data-testid="childMsg">{this.childHelloModel.state.msg}</div>
            <HelloController />
          </div>
        );
      }
    }

    const app = await startAppWithRoute(
      [
        {
          path: "/parent",
          componentName: "layoutParentController",
          componentModule: { LayoutParentController },
          children: [
            {
              path: "/parent/child",
              componentName: "layoutChildController",
              componentModule: { LayoutChildController },
            } as IReactRoute,
          ],
        } as IReactRoute,
      ],
      "/parent/child"
    );
    const appContent = app.start();
    const initManager = app.getSync(ReactAppInitManager);
    const reduxService = app.getSync(ReactReduxService);
    reduxService.startRecordState();
    renderToStaticMarkup(appContent);
    let actions = reduxService.stopRecordState();
    expect(actions.length).toBe(0);

    const allRouteControllers = initManager.getAllRouteControllers();
    const routes = [...allRouteControllers.keys()];
    expect(routes).toMatchObject(["/parent", "/parent/child"]);

    reduxService.startRecordState();
    await initManager.initControllers("/parent");
    const initParentState = mergeSetState(reduxService.stopRecordState());
    expect(initParentState).toMatchObject({
      parentHelloModel: { msg: "From parent initialModelStaticState" },
      reactAppInitManager: {
        "/parent": { pathname: "/parent", initStatic: 2, init: 2 },
      },
    });
    expect(initParentState.childHelloModel).toBe(undefined);

    reduxService.startRecordState();
    await initManager.initControllers("/parent/child");
    const initChildState = mergeSetState(reduxService.stopRecordState());
    expect(initChildState).toMatchObject({
      childHelloModel: { msg: "From child initialModelStaticState" },
      reactAppInitManager: {
        "/parent/child": { pathname: "/parent/child", initStatic: 2, init: 2 },
      },
    });
    expect(initChildState.parentHelloModel).toBe(undefined);
  });
});

function mergeSetState(actions: AnyAction[]) {
  let mergeState = {} as Record<string, any>;
  for (const action of actions) {
    const { type } = action;
    const setStateMatch = typeof type === "string" && type.match(/(\w+)\/__SET_STATE/);
    if (setStateMatch) {
      const modelNs = setStateMatch[1];
      mergeState[modelNs] = Object.assign({}, mergeState[modelNs], action.state);
    } else {
      throw new Error("Can not merge mode setState, action type:" + type);
    }
  }
  return mergeState;
}

@ReactModel()
class HelloModel extends BaseReactModel<{ msg: string }> {
  getInitState(): { msg: string } {
    return { msg: "Init Msg" };
  }

  async setMsg(msg: string) {
    this.setState({
      msg: msg,
    });
  }
}

// @ReactRoute({ path: "/hello" })
@ReactController()
class HelloController extends BaseReactController {
  state = {
    msg: "Init Msg",
  };
  async initialModelStaticState(): Promise<void | number> {
    this.setState({
      msg: "Static Hello",
    });
  }

  async initialModelState() {
    this.setState({
      msg: "Dynamic Hello",
    });
  }

  renderView() {
    return <div data-testid="helloMsg">{this.state.msg}</div>;
  }
}
