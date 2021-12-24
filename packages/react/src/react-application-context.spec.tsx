import React from "react";
import { ReactApplicationConfig } from "./react-application-config";
import { ReactApplicationContext } from "./react-application-context";
import { BaseReactModel } from "./base-react-model";
import { BaseReactController } from "./base-react-controller";
import { render } from "@testing-library/react";
import { ReactModel } from "./react-model.decorator";
import { ReactController } from "./react-controller.decorator";
import { matchPath, MemoryRouter, useLocation } from "react-router-dom";
import "reflect-metadata";
import { ReactApplicationConfiguration } from "./react-application.configuration";
import { Configuration, Inject, ApplicationContainer } from "@symph/core";
import { ReactApplicationFactory } from "./react-application-factory";
import { ReactComponent } from "./react-component.decorator";

describe("react-application", () => {
  describe("react-application", () => {
    test("create", async () => {
      @ReactComponent()
      class HelloProvider {
        private message = "hello world";

        hello() {
          return this.message;
        }
      }

      @Configuration()
      class AppConfig {
        @Configuration.Component()
        public helloProvider: HelloProvider;
      }

      const app = new ReactApplicationContext(ReactApplicationConfiguration);
      await app.init();
      app.registerModule(AppConfig);

      const helloProvider = await app.get(HelloProvider);
      expect(helloProvider!.hello()).toBe("hello world");
    });
  });

  describe("react-mvc", () => {
    test("define a react controller", async () => {
      @ReactController()
      class HelloController extends BaseReactController<{ propMsg: string }, { stateMsg: string }> {
        constructor(props: any, context: any) {
          super(props, context);
          this.state = {
            stateMsg: "hello stateMsg",
          };
        }

        renderView() {
          const { propMsg } = this.props;
          const { stateMsg } = this.state;
          return (
            <div>
              <span data-testid="propMsg">{propMsg}</span>
              <span data-testid="stateMsg">{stateMsg}</span>
            </div>
          );
        }
      }

      const app = await ReactApplicationFactory.create();
      const App = app.start(() => <HelloController propMsg={"hello propMsg"} />);
      const { getByTestId, container, rerender } = render(App);
      expect(getByTestId("propMsg").innerHTML).toEqual("hello propMsg");
      expect(getByTestId("stateMsg").innerHTML).toEqual("hello stateMsg");
    });

    test("should bind model and controller ", async () => {
      @ReactModel()
      class HelloModel extends BaseReactModel<{ status: string }> {
        getInitState(): { status: string } {
          return { status: "init" };
        }
      }

      @ReactController()
      class HelloController extends BaseReactController {
        @Inject()
        private helloModel: HelloModel;

        renderView() {
          const { status } = this.helloModel.state;
          return (
            <div>
              <span data-testid="status">{status}</span>
            </div>
          );
        }
      }

      const app = await ReactApplicationFactory.create();
      const App = app.start(() => <HelloController />);
      const { getByTestId, container, rerender } = render(App);
      const statusDom = getByTestId("status");
      expect(statusDom.innerHTML).toEqual("init");
    });

    test("should load model instance in controller, when model is pre registered", async () => {
      @ReactModel()
      class HelloModel extends BaseReactModel<{ status: string }> {
        getInitState(): { status: string } {
          return { status: "init" };
        }

        async say() {
          this.setState({
            status: "say",
          });
        }
      }

      @ReactController()
      class HelloController extends BaseReactController<{
        message: string;
      }> {
        @Inject()
        private helloModel: HelloModel;

        componentDidMount() {
          super.componentDidMount();
          setTimeout(async () => {
            this.helloModel.say();
          }, 50);
        }

        renderView():
          | React.ReactElement<any, string | React.JSXElementConstructor<any>>
          | string
          | number
          | React.ReactNodeArray
          | React.ReactPortal
          | boolean
          | null
          | undefined {
          const { message } = this.props;
          const { status } = this.helloModel.state;
          return (
            <div>
              <span>controller</span>
              <span>controller</span>
              {/*<span data-testid='providerHell0'>{this.helloProvider.hello()}</span>*/}
              <span data-testid="message">{message}</span>
              <span data-testid="status">{status}</span>
            </div>
          );
        }
      }

      @Configuration()
      class AppConfig {
        @Configuration.Component()
        helloModel: HelloModel;
      }

      // const app = await SymphReactFactory.create(AppConfig)
      const app = new ReactApplicationContext(ReactApplicationConfiguration, new ReactApplicationConfig());
      await app.init();
      // const helloModel = await app.get(HelloModel,)
      // expect(helloModel).not.toBeNull()

      const App = app.start(() => <HelloController message={"hello from props"} />);
      const { getByTestId, container, rerender } = render(App);
      const messageDom = getByTestId("message");
      const statusDom = getByTestId("status");
      expect(messageDom.innerHTML).toEqual("hello from props");
      expect(statusDom.innerHTML).toEqual("init");
      await new Promise((resolve) => setTimeout(resolve, 200));
      expect(statusDom.innerHTML).toEqual("say");
    });

    test("should dynamic load the model instance at run time", async () => {
      @ReactModel()
      class HelloModel extends BaseReactModel<{ status: string }> {
        getInitState(): { status: string } {
          return { status: "init" };
        }

        async say() {
          this.setState({
            status: "say",
          });
        }
      }

      @ReactController()
      class HelloController extends BaseReactController<{
        message: string;
      }> {
        @Inject()
        private helloModel: HelloModel;

        constructor(props: any, context: any) {
          super(props, context);
          setTimeout(async () => {
            await this.helloModel.say();
          }, 500);
        }

        renderView():
          | React.ReactElement<any, string | React.JSXElementConstructor<any>>
          | string
          | number
          | React.ReactNodeArray
          | React.ReactPortal
          | boolean
          | null
          | undefined {
          const { message } = this.props;
          const { status } = this.helloModel.state;

          return (
            <div>
              <span>controller</span>
              <span>controller</span>
              <span data-testid="message">{message}</span>
              <span data-testid="status">{status}</span>
            </div>
          );
        }
      }

      const app = await ReactApplicationFactory.create();
      const App = app.start(() => <HelloController message={"hello from props"} />);
      const { getByTestId, container, rerender } = render(App);
      const messageDom = getByTestId("message");
      const statusDom = getByTestId("status");
      expect(messageDom.innerHTML).toEqual("hello from props");
      expect(statusDom.innerHTML).toEqual("init");
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    test("should use provider.id as model's namespace", async () => {
      @ReactModel()
      class HelloModel extends BaseReactModel<{ status: string }> {
        getInitState(): { status: string } {
          return { status: "init" };
        }

        async say() {
          this.setState({
            status: "say",
          });
        }
      }

      @ReactController()
      class HelloController extends BaseReactController {
        @Inject()
        private helloModel: HelloModel;

        @Inject("helloModel1")
        private helloModel1: HelloModel;

        componentDidMount() {
          super.componentDidMount();
          this.helloModel1.say();
        }

        renderView():
          | React.ReactElement<any, string | React.JSXElementConstructor<any>>
          | string
          | number
          | React.ReactNodeArray
          | React.ReactPortal
          | boolean
          | null
          | undefined {
          const { status } = this.helloModel.state;
          const { status: status1 } = this.helloModel1.state;
          return (
            <div>
              <span data-testid="status">{status}</span>
              <span data-testid="status1">{status1}</span>
            </div>
          );
        }
      }

      const app = await ReactApplicationFactory.create();
      const App = app.start(() => <HelloController message={"hello from props"} />);
      const { getByTestId, container, rerender } = render(App);
      const statusDom = getByTestId("status");
      const statusDom1 = getByTestId("status1");
      expect(statusDom.innerHTML).toEqual("init");
      expect(statusDom1.innerHTML).toEqual("say");
    });
  });
});
