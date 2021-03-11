import { Inject, Injectable } from "../decorators/core";
import React from "react";
import { Configuration } from "../decorators/core/configuration.decorator";
import { Provider } from "../decorators/core/provider.decorator";
import { ApplicationConfig } from "./application-config";
import { JoyContainer } from "../injector";
import { ReactApplicationContext } from "./react-application-context";
import { ReactModel } from "./react-model";
import { ReactController } from "./react-controller";
import { TempoFactory } from "../tempo-factory";
import { render } from "@testing-library/react";
import { Model } from "./react-model.decorator";
import { Controller } from "./react-controller.decorator";

describe("react-application", () => {
  describe("react-application", () => {
    test("create", async () => {
      @Injectable()
      class HelloProvider {
        private message = "hello world";

        hello() {
          return this.message;
        }
      }

      @Configuration()
      class AppConfig {
        @Provider()
        public helloProvider: HelloProvider;
      }

      const applicationConfig = new ApplicationConfig();
      const container = new JoyContainer();
      const app = new ReactApplicationContext(
        AppConfig,
        applicationConfig,
        container
      );
      await app.init();

      const helloProvider = await app.get(HelloProvider);
      expect(helloProvider.hello()).toBe("hello world");
    });
  });

  describe("react-mvc", () => {
    test("define a react controller", async () => {
      @Controller()
      class HelloController extends ReactController<
        { propMsg: string },
        { stateMsg: string }
      > {
        constructor(props, context) {
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

      const app = await TempoFactory.create({});
      const App = app.start();
      const { getByTestId, container, rerender } = render(
        <App>
          <HelloController propMsg={"hello propMsg"} />
        </App>
      );
      expect(getByTestId("propMsg").innerHTML).toEqual("hello propMsg");
      expect(getByTestId("stateMsg").innerHTML).toEqual("hello stateMsg");
    });

    test("should bind model and controller ", async () => {
      @Model()
      class HelloModel extends ReactModel<{ status: string }> {
        getInitState(): { status: string } {
          return { status: "init" };
        }
      }

      @Controller()
      class HelloController extends ReactController {
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

      const app = await TempoFactory.create({});
      const App = app.start();
      const { getByTestId, container, rerender } = render(
        <App>
          <HelloController />
        </App>
      );
      const statusDom = getByTestId("status");
      expect(statusDom.innerHTML).toEqual("init");
    });

    test("should load model instance in controller, when model is pre registered", async () => {
      @Model()
      class HelloModel extends ReactModel<{ status: string }> {
        getInitState(): { status: string } {
          return { status: "init" };
        }

        async say() {
          this.setState({
            status: "say",
          });
        }
      }

      @Controller()
      class HelloController extends ReactController<{
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
        @Provider()
        helloModel: HelloModel;
      }

      // const app = await TempoFactory.create(AppConfig)
      const app = new ReactApplicationContext({}, new ApplicationConfig());
      await app.init();
      // const helloModel = await app.get(HelloModel,)
      // expect(helloModel).not.toBeNull()

      const App = app.start();
      const { getByTestId, container, rerender } = render(
        <App>
          <HelloController message={"hello from props"} />
        </App>
      );
      const messageDom = getByTestId("message");
      const statusDom = getByTestId("status");
      expect(messageDom.innerHTML).toEqual("hello from props");
      expect(statusDom.innerHTML).toEqual("init");
      await new Promise((resolve) => setTimeout(resolve, 200));
      expect(statusDom.innerHTML).toEqual("say");
    });

    test("should dynamic load the model instance at run time", async () => {
      @Model({ autoReg: true })
      class HelloModel extends ReactModel<{ status: string }> {
        getInitState(): { status: string } {
          return { status: "init" };
        }

        async say() {
          this.setState({
            status: "say",
          });
        }
      }

      @Controller()
      class HelloController extends ReactController<{
        message: string;
      }> {
        @Inject()
        private helloModel: HelloModel;

        constructor(props, context) {
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

      const app = await TempoFactory.create({});
      const App = app.start();
      const { getByTestId, container, rerender } = render(
        <App>
          <HelloController message={"hello from props"} />
        </App>
      );
      const messageDom = getByTestId("message");
      const statusDom = getByTestId("status");
      expect(messageDom.innerHTML).toEqual("hello from props");
      expect(statusDom.innerHTML).toEqual("init");
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    test("should use provider.id as model's namespace", async () => {
      @Model()
      class HelloModel extends ReactModel<{ status: string }> {
        getInitState(): { status: string } {
          return { status: "init" };
        }

        async say() {
          this.setState({
            status: "say",
          });
        }
      }

      @Controller()
      class HelloController extends ReactController {
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

      const app = await TempoFactory.create({});
      const App = app.start();
      const { getByTestId, container, rerender } = render(
        <App>
          <HelloController message={"hello from props"} />
        </App>
      );
      const statusDom = getByTestId("status");
      const statusDom1 = getByTestId("status1");
      expect(statusDom.innerHTML).toEqual("init");
      expect(statusDom1.innerHTML).toEqual("say");
    });
  });
});
