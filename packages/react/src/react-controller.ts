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
import { EnumReactAppInitStage } from "./react-app-init-stage.enum";

export type ControllerBaseStateType = {
  _modelStateVersion: number;
  [keys: string]: unknown;
};

export interface ReactController {
  /**
   * 获取预渲染的状态
   */
  initialModelStaticState?(urlParams: any): Promise<void | number>;

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
> extends Component<TProps, TState, TContext> {
  __proto__: typeof React.Component;

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

  protected _models: Array<ReactModel<unknown>>;

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

    this.routeMeta = getRouteMeta(this.constructor);
    this.appContext = context;
    this.reduxStore = this.appContext.syncGetProvider(ReactReduxService)!;
  }

  shouldComponentUpdate(
    nextProps: Readonly<TProps>,
    nextState: Readonly<TState>,
    nextContext: any
  ): boolean {
    this.bindProps();
    return true;
  }

  componentDidMount(): void {
    this.isCtlMounted = true;
  }

  componentWillUnmount(): void {
    this.isCtlMounted = false;
    if (this._models) {
      this.reduxStore.rmModelStateListener(
        this._models.map((it) => it.getNamespace()),
        this.modelStateListener
      );
    }
    this.initManager.resetInitState(this.location.pathname);
  }

  protected bindProps() {
    this.location = (this.props as any).location || window.location;
    if (this.routeMeta) {
      bindRouteFromCompProps(this, this.props);
    }
  }

  protected async init(): Promise<void> {
    if (this.hasInitInvoked) {
      throw new Error("Controller init twice");
    }
    this.hasInitInvoked = true;

    this.injectProps();
    this.bindProps();

    this.state = {
      ...this.state,
      _modelStateVersion: 1,
    };

    const { pathname } = this.location;
    const renderStage = this.initManager.initStage;
    const { initStatic, init } = this.initManager.getState(pathname);

    if (renderStage >= EnumReactAppInitStage.STATIC) {
      if (
        this.initialModelStaticState &&
        (initStatic === JoyRouteInitState.NONE ||
          initStatic === JoyRouteInitState.ERROR)
      ) {
        const initStaticTask = Promise.resolve(this.initialModelStaticState({}))
          .then((rst) => {
            this.initManager.setInitState(pathname, {
              initStatic: JoyRouteInitState.SUCCESS,
            });
            return rst;
          })
          .catch((e) => {
            console.error(e);
            this.initManager.setInitState(pathname, {
              initStatic: JoyRouteInitState.ERROR,
            });
          });
        if (typeof window == "undefined" && initStaticTask) {
          // only on server side
          this.initManager.addTask(pathname, initStaticTask);
        }
      }
    }

    if (renderStage >= EnumReactAppInitStage.DYNAMIC) {
      if (
        this.initialModelState &&
        (init === JoyRouteInitState.NONE || init === JoyRouteInitState.ERROR)
      ) {
        const initTask = Promise.resolve(this.initialModelState({}))
          .then((rst) => {
            this.initManager.setInitState(pathname, {
              init: JoyRouteInitState.SUCCESS,
            });
            return rst;
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
    this._models = new Array<ReactModel<unknown>>();
    for (let i = 0; i < propDeps.length; i++) {
      const model = propDeps[i].instance;
      if (ReactModel.isModel(model)) {
        this._models.push(model);
      }
    }
    if (this._models.length) {
      this.reduxStore.addModelStateListener(
        this._models.map((it) => it.getNamespace()),
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
    const { initStatic, init } = this.initManager.getState(
      this.location.pathname
    );

    if (!this.hasInjectProps || initStatic === JoyRouteInitState.LOADING) {
      return "loading...";
    }
    if (initStatic === JoyRouteInitState.ERROR) {
      return `controller ${this.constructor.name} init static model state failed`;
    }

    if (init === JoyRouteInitState.ERROR) {
      console.warn(
        `controller${this.constructor.name} init model state failed`
      );
    }

    return this.renderView();
  }

  abstract renderView(): ReactNode;
}
