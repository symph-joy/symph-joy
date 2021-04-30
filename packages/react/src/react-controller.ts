import React, { Component, ReactNode } from "react";
import { JoyReactContext } from "./react-app-container";
import {
  ModelStateChangeHandler,
  ReactReduxService,
} from "./redux/react-redux.service";
import { ReactModel } from "./react-model";
import {
  bindRouteFromCompProps,
  getRouteMeta,
  IRouteMeta,
} from "./router/react-route.decorator";
import { IInjectableDependency, IJoyContext, Inject } from "@symph/core";
import {
  JoyRouteInitState,
  ReactAppInitManager,
} from "./react-app-init-manager";
import { ReactRouter } from "./router/react-router";
import type { Location } from "history";

export type ControllerBaseStateType = {
  _modelStateVersion: number;
  [keys: string]: unknown;
};

export interface ReactController {
  /**
   * 获取预渲染的状态
   */
  initialModelStaticState?(urlParams: any): Promise<void>;

  /**
   * 获取绑定model中的初始化状态。
   * @param context
   */
  initialModelState?(context: any): Promise<void>;
}

/**
 * todo model 状态发生改变后，如何精细的判断是否有必要刷新组件？
 */
export abstract class ReactController<
  TProps = Record<string, unknown>,
  TState = Record<string, unknown>,
  TContext extends IJoyContext = IJoyContext
  // TStaticState = any
> extends Component<TProps, TState, TContext> {
  __proto__: typeof React.Component;

  // todo 在Route装饰器中实现
  // /**
  //  * 生成预渲染的路径，
  //  */
  // async buildPreRenderPaths(): Promise<any> {
  //   return undefined
  // }

  // /**
  //  * 获取预渲染的状态
  //  */
  // async getSub(): Promise<Record<string, any>> {
  //   return {};
  // }

  /**
   * 向后兼容：
   * 进行组件渲染的的准备工作，可以在服务端和浏览器上运行,
   * @param context
   */
  async componentPrepare(context: any): Promise<void> {}

  static contextType = JoyReactContext;

  protected appContext: IJoyContext;
  protected reduxStore: ReactReduxService;
  protected isCtlMounted: boolean;
  protected routeMeta?: IRouteMeta;

  private hasInitInvoked = false;
  private hasInjectProps = false;

  @Inject()
  protected reactRouter: ReactRouter;

  @Inject()
  protected initManager: ReactAppInitManager;

  protected location: Location;

  public async prepareComponent(): Promise<any> {}

  constructor(props: TProps, context: TContext) {
    super(props, context);
    // this.hasInitInvoked = false;
    // this.hasInjectProps = false;
    this.isCtlMounted = false;
    this.appContext = context;
    this.reduxStore = this.appContext.syncGetProvider(ReactReduxService)!;

    this.routeMeta = getRouteMeta(this.constructor);
    if (this.routeMeta) {
      bindRouteFromCompProps(this, this.props);
    }
  }

  shouldComponentUpdate(
    nextProps: Readonly<TProps>,
    nextState: Readonly<TState>,
    nextContext: any
  ): boolean {
    if (this.routeMeta) {
      bindRouteFromCompProps(this, nextProps);
    }
    return true;
  }

  componentDidMount(): void {
    this.isCtlMounted = true;
    this.initManager.resetInitState(this.location.pathname);
    // todo  移除事件监听
  }

  protected async init(): Promise<void> {
    if (this.hasInitInvoked) {
      throw new Error("Controller init twice");
    }
    this.hasInitInvoked = true;

    this.injectProps();
    this.state = {
      ...this.state,
      _modelStateVersion: 1,
    };

    // todo prepare component
    console.log(">>>> controller.props", this.props);
    // const initManager = await this.appContext.get(ReactAppInitManager);
    this.location = (this.props as any).location;
    const { pathname } = this.location;
    const isRenderStatic = this.initManager.isRenderStatic;
    const { initStatic, init } = this.initManager.state[pathname] || {
      initStatic: JoyRouteInitState.NONE,
      init: JoyRouteInitState.NONE,
    };

    if (
      initStatic !== JoyRouteInitState.SUCCESS &&
      this.initialModelStaticState
    ) {
      const initStaticTask = Promise.resolve(this.initialModelStaticState({}))
        .then(() => {
          this.initManager.setInitState(pathname, {
            initStatic: JoyRouteInitState.SUCCESS,
          });
        })
        .catch((e) => {
          this.initManager.setInitState(pathname, {
            initStatic: JoyRouteInitState.ERROR,
          });
        });
      if (typeof window == "undefined" && initStaticTask) {
        // only on server side
        this.initManager.addTask(pathname, initStaticTask);
      }
    } else {
      this.initManager.setInitState(pathname, {
        initStatic: JoyRouteInitState.SUCCESS,
      });
    }
    // 如果实在ssg接口，只渲染静态状态部分。
    if (!isRenderStatic) {
      if (init !== JoyRouteInitState.SUCCESS && this.initialModelState) {
        const initTask = Promise.resolve(this.initialModelState({}))
          .then(() => {
            this.initManager.setInitState(pathname, {
              init: JoyRouteInitState.SUCCESS,
            });
          })
          .catch((e) => {
            this.initManager.setInitState(pathname, {
              init: JoyRouteInitState.ERROR,
            });
          });
        if (typeof window == "undefined" && initTask) {
          // only on server side
          this.initManager.addTask(pathname, initTask);
        }
      } else {
        this.initManager.setInitState(pathname, {
          init: JoyRouteInitState.SUCCESS,
        });
      }
    }
  }

  /**
   * !import： must called in subclass of constructor
   * @private
   */
  private injectProps(): void {
    const controllerType = Object.getPrototypeOf(this).constructor;
    const injectedProps = this.appContext.resolveProperties(
      this,
      controllerType
    );
    if (injectedProps instanceof Promise) {
      this.hasInjectProps = false;
      injectedProps.then((props) => {
        this.registersModel(props);
        this.hasInjectProps = true;
      });
    } else {
      this.registersModel(injectedProps);
      this.hasInjectProps = true;
    }
  }

  private registersModel(propDeps: IInjectableDependency[]) {
    const models = new Array<ReactModel<unknown>>();
    for (let i = 0; i < propDeps.length; i++) {
      const model = propDeps[i].instance;
      if (ReactModel.isModel(model)) {
        models.push(model);
      }
    }
    if (models.length) {
      this.reduxStore.addModelStateListener(
        models.map((it) => it.getNamespace()),
        this.modelStateListener
      );
    }
  }

  protected modelStateListener: ModelStateChangeHandler = (
    models,
    nextState,
    previousState
  ) => {
    if (!this.isCtlMounted) {
      return;
    }

    this.setState({
      // @ts-ignore
      _modelStateVersion: this.state._modelStateVersion + 1,
    });
  };

  render(): ReactNode {
    const { initStatic, init } = this.initManager.state[this.location.pathname];

    if (!this.hasInjectProps || initStatic === JoyRouteInitState.LOADING) {
      return "loading...";
    }
    if (initStatic === JoyRouteInitState.ERROR) {
      return `controller${this.constructor.name} initStatic failed`;
    }

    if (init === JoyRouteInitState.ERROR) {
      console.warn(`controller${this.constructor.name} initStatic failed`);
    }

    return this.renderView();
  }

  abstract renderView(): ReactNode;
}
