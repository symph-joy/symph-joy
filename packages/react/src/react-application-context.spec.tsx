import React from "react";
import { ApplicationConfig } from "./application-config";
import { ReactApplicationContext } from "./react-application-context";
import { ReactBaseModel } from "./react-base-model";
import { ReactBaseController } from "./react-base-controller";
import { render } from "@testing-library/react";
import { ReactModel } from "./react-model.decorator";
import { ReactController } from "./react-controller.decorator";
import { matchPath, MemoryRouter, useLocation } from "react-router-dom";
import "reflect-metadata";
import { ReactApplicationConfig } from "./react-application-config";
import { Configuration, Autowire, CoreContainer } from "@symph/core";
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
        @Configuration.Provider()
        public helloProvider: HelloProvider;
      }

      const applicationConfig = new ApplicationConfig();
      const container = new CoreContainer();
      const app = new ReactApplicationContext(ReactApplicationConfig, applicationConfig, container);
      await app.init();
      app.registerModule(AppConfig);

      const helloProvider = await app.get(HelloProvider);
      expect(helloProvider!.hello()).toBe("hello world");
    });
  });

  describe("react-mvc", () => {
    test("define a react controller", async () => {
      @ReactController()
      class HelloController extends ReactBaseController<{ propMsg: string }, { stateMsg: string }> {
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
      class HelloModel extends ReactBaseModel<{ status: string }> {
        getInitState(): { status: string } {
          return { status: "init" };
        }
      }

      @ReactController()
      class HelloController extends ReactBaseController {
        @Autowire()
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
      class HelloModel extends ReactBaseModel<{ status: string }> {
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
      class HelloController extends ReactBaseController<{
        message: string;
      }> {
        @Autowire()
        private helloModel: HelloModel;

        componentDidMount() {
          super.componentDidMount();
          setTimeout(async () => {
            this.helloModel.say();
          }, 50);
        }

        renderView(): React.ReactElement<any, string | React.JSXElementConstructor<any>> | string | number | React.ReactNodeArray | React.ReactPortal | boolean | null | undefined {
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
        @Configuration.Provider()
        helloModel: HelloModel;
      }

      // const app = await SymphReactFactory.create(AppConfig)
      const app = new ReactApplicationContext(ReactApplicationConfig, new ApplicationConfig());
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
      class HelloModel extends ReactBaseModel<{ status: string }> {
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
      class HelloController extends ReactBaseController<{
        message: string;
      }> {
        @Autowire()
        private helloModel: HelloModel;

        constructor(props: any, context: any) {
          super(props, context);
          setTimeout(async () => {
            await this.helloModel.say();
          }, 500);
        }

        renderView(): React.ReactElement<any, string | React.JSXElementConstructor<any>> | string | number | React.ReactNodeArray | React.ReactPortal | boolean | null | undefined {
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
      class HelloModel extends ReactBaseModel<{ status: string }> {
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
      class HelloController extends ReactBaseController {
        @Autowire()
        private helloModel: HelloModel;

        @Autowire("helloModel1")
        private helloModel1: HelloModel;

        componentDidMount() {
          super.componentDidMount();
          this.helloModel1.say();
        }

        renderView(): React.ReactElement<any, string | React.JSXElementConstructor<any>> | string | number | React.ReactNodeArray | React.ReactPortal | boolean | null | undefined {
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

  describe("react-mvc-router", () => {
    test("should dispatch router", async () => {
      function controllerScanner() {}

      controllerScanner();

      const location = { pathname: "/post/1", search: "", state: "", hash: "" };

      interface RouteContainerOptions {
        baseroute: string | { path: string };
        // root: {
        //   path: string
        // }
        location?: {
          pathname: string;
        };
      }

      function RouteDispatch(options: RouteContainerOptions) {
        const { baseroute, location } = options;
        const globalLocation = useLocation();
        const { pathname } = location || globalLocation;
        // if (parent){
        //   const a =  Reflect.getMetadata('__joy_injectable__', parent.constructor)
        //   console.log(a, routes)
        //   parentPath = a.path
        // }
        // if (root) {
        //   parentPath = root.path
        // }
        const basepath = typeof baseroute === "string" ? baseroute : baseroute.path;

        let childRoute: any;
        let matched: any;
        for (const curRoute of routes) {
          if (!curRoute.path.startsWith(basepath) || curRoute.path === baseroute) {
            continue;
          }
          matched = matchPath(pathname, curRoute);
          if (matched) {
            childRoute = curRoute;
            break;
          }
        }
        console.log(childRoute, matched);

        return <childRoute.component match={matched} />;
      }

      function MainLayout({ match }: any) {
        return (
          <div>
            <h1>header</h1>
            <RouteDispatch baseroute={"/"} />
          </div>
        );
      }

      function PostDetail({ id }: { id: string }) {
        return <div>post detail, id={id}</div>;
      }

      @ReactController({ path: "/post" })
      // @Controller()
      class PostController extends ReactBaseController {
        // @Controller.BindPathVariable({key: 'postId'})
        // private postId: string

        // @Controller.BindQueryVariable('isShow')
        // private isShow: string

        renderView() {
          // console.log(this.postId)
          return (
            <div>
              <span data-testid="status">hello</span>
              <RouteDispatch baseroute={this.props.match as any} />
            </div>
          );
        }
      }

      const routes = [
        {
          path: "/",
          component: MainLayout,
        },
        {
          path: "/post/index",
          component: PostController,
        },
        {
          path: "/post/:id",
          component: PostDetail,
        },
        {
          path: "/login",
          component: () => <div>'login page'</div>,
        },
      ];

      const app = await ReactApplicationFactory.create();
      const App = app.start(() => (
        <MemoryRouter initialEntries={[location]} initialIndex={0}>
          {/*<Switch location={{pathname:'/user', search:'', state: '', hash: ''}}>*/}
          {/*  <Route path="/" component={PostController} />*/}
          {/*</Switch>*/}
          <RouteDispatch baseroute="" />
        </MemoryRouter>
      ));
      const { getByTestId, container, rerender } = render(App);
      console.log(container.innerHTML);
      // const statusDom = getByTestId("status");
      // expect(statusDom.innerHTML).toEqual("init");
    });
  });
});
