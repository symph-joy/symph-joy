import React, { Component, ReactNode } from "react";
import { ReactApplicationReactContext } from "./react-app-container";
import { ModelStateChangeHandler, ReactReduxService } from "./redux/react-redux.service";
import { BaseReactModel } from "./base-react-model";
import { bindRouteFromCompProps } from "./router/react-route.decorator";
import { IApplicationContext, IInjectableDependency, Inject } from "@symph/core";
import { ReactAppInitManager, ReactRouteInitStatus } from "./react-app-init-manager";
import { ReactRouterService } from "./router/react-router-service";
import type { Location } from "history";
import { EnumReactAppInitStage } from "./react-app-init-stage.enum";
import { IReactRoute } from "./interfaces";
import { NavigateFunction, PathMatch } from "react-router";

export type ControllerBaseStateType = {
  _modelStateVersion: number;
  [keys: string]: unknown;
};

export interface BaseReactController {
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

interface ControllerProps {
  route?: IReactRoute;
  match?: PathMatch;
  location?: Location;
  navigate?: NavigateFunction;
}

/**
 * todo model 状态发生改变后，如何精细的判断是否有必要刷新组件？
 */
export abstract class BaseReactController<
  TProps = Record<string, unknown>,
  TState = Record<string, unknown>,
  TContext extends IApplicationContext = IApplicationContext
> extends Component<TProps & ControllerProps, TState, TContext> {
  __proto__: typeof React.Component;

  /**
   * 向后兼容：
   * 进行组件渲染的的准备工作，可以在服务端和浏览器上运行,
   * @param context
   */
  async componentPrepare(context: any): Promise<void> {}

  static contextType = ReactApplicationReactContext;

  protected appContext: IApplicationContext;
  protected reduxStore: ReactReduxService;
  protected isCtlMounted: boolean;

  protected _models: Array<BaseReactModel<unknown>>;

  private hasInitInvoked = false;
  private hasInjectProps = false;

  @Inject()
  protected reactRouterService: ReactRouterService;

  @Inject()
  protected initManager: ReactAppInitManager;

  protected location: Location;

  public async prepareComponent(): Promise<any> {}

  private isRendingView = false;
  private modelStateDeps: Record<string, string[]> = {};

  constructor(props: TProps, context: TContext) {
    super(props as any, context);
    // this.hasInitInvoked = false;
    // this.hasInjectProps = false;
    this.isCtlMounted = false;

    this.appContext = context;
    this.reduxStore = this.appContext.getSync(ReactReduxService)!;
  }

  shouldComponentUpdate(nextProps: Readonly<TProps>, nextState: Readonly<TState>, nextContext: any): boolean {
    this.bindProps(nextProps);
    return true;
  }

  componentDidMount(): void {
    this.isCtlMounted = true;
  }

  componentWillUnmount(): void {
    this.isCtlMounted = false;
    let pathname: string = this.props.match?.pathname || this.location.pathname;
    if (this._models) {
      this.reduxStore.rmModelStateListener(
        this._models.map((it) => it.getNamespace()),
        this.modelStateListener
      );
    }
    this.initManager.resetInitState(pathname);
  }

  protected bindProps(props: TProps) {
    this.location = (this.props as any).location || window.location;
    bindRouteFromCompProps(this, props);
  }

  protected async init(): Promise<void> {
    if (this.hasInitInvoked) {
      throw new Error("Controller init twice");
    }
    this.hasInitInvoked = true;

    this.injectProps();
    this.bindProps(this.props);

    this.state = {
      ...this.state,
      _modelStateVersion: 1,
    };
    let pathname: string = this.props.match?.pathname || this.location.pathname;
    const initStage = this.initManager.initStage;
    const { initStatic, init } = this.initManager.getRouteInitState(pathname);

    if (initStage >= EnumReactAppInitStage.STATIC) {
      if (initStatic === undefined || initStatic === ReactRouteInitStatus.NONE || initStatic === ReactRouteInitStatus.ERROR) {
        if (this.initialModelStaticState) {
          const initStaticTask = Promise.resolve(this.initialModelStaticState({}))
            // .then((rst) => {
            //   this.initManager.setInitState(pathname, {
            //     initStatic: ReactRouteInitStatus.SUCCESS,
            //   });
            //   return rst;
            // })
            .catch((e) => {
              console.error(e);
              this.initManager.setInitState(pathname, {
                initStatic: ReactRouteInitStatus.ERROR,
              });
            });
          if (typeof window === "undefined" && initStaticTask) {
            // only on server side
            this.initManager.addTask(pathname, initStaticTask);
          }
        } else {
          // this.initManager.setInitState(pathname, {
          //   initStatic: ReactRouteInitStatus.SUCCESS,
          // });
        }
      }
    }

    if (initStage >= EnumReactAppInitStage.DYNAMIC) {
      if (init === undefined || init === ReactRouteInitStatus.NONE || init === ReactRouteInitStatus.ERROR) {
        if (this.initialModelState) {
          const initTask = Promise.resolve(this.initialModelState({}))
            // .then((rst) => {
            //   this.initManager.setInitState(pathname, {
            //     init: ReactRouteInitStatus.SUCCESS,
            //   });
            //   return rst;
            // })
            .catch((e) => {
              this.initManager.setInitState(pathname, {
                init: ReactRouteInitStatus.ERROR,
              });
            });
          if (typeof window == "undefined" && initTask) {
            // only on server side
            this.initManager.addTask(pathname, initTask);
          }
        } else {
          // this.initManager.setInitState(pathname, {
          //   init: ReactRouteInitStatus.SUCCESS,
          // });
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
    const injectedProps = this.appContext.resolveProperties(this, controllerType);
    if (injectedProps instanceof Promise) {
      this.hasInjectProps = false;
      injectedProps
        .then((props) => {
          this.registersModel(props);
          this.hasInjectProps = true;
        })
        .catch((err) => {
          console.error(`Init controller failed, controller name: ${controllerType.name}, err: ${err}.`);
        });
    } else {
      this.registersModel(injectedProps);
      this.hasInjectProps = true;
    }
  }

  private registersModel(propDeps: IInjectableDependency[]) {
    this._models = new Array<BaseReactModel<unknown>>();
    for (let i = 0; i < propDeps.length; i++) {
      const propDep = propDeps[i];
      const instance = propDep.instance;
      if (!BaseReactModel.isModel(instance)) {
        continue;
      }
      const model = instance as BaseReactModel<unknown>;
      this[propDep.key as keyof this] = this.createModelProxy(model) as any;
      this._models.push(model);
    }
    if (this._models.length) {
      this.reduxStore.addModelStateListener(
        this._models.map((it) => it.getNamespace()),
        this.modelStateListener
      );
    }
  }

  private createModelProxy(model: BaseReactModel<unknown>): BaseReactModel<unknown> {
    const modelNs = model.getNamespace();
    return new Proxy(model, {
      get: (target: BaseReactModel<any>, p: string | symbol, receiver: any): any => {
        if (p === "state") {
          return new Proxy(target[p], {
            get: (state: any, stateProp: string | symbol, receiver: any): any => {
              if (this.isRendingView) {
                if (!this.modelStateDeps[modelNs]) {
                  this.modelStateDeps[modelNs] = [];
                }
                this.modelStateDeps[modelNs].push(stateProp as string);
              }
              return state[stateProp];
            },
          });
        } else {
          return (target as any)[p];
        }
      },
    });
  }

  protected modelStateListener: ModelStateChangeHandler = (models, nextState, previousState) => {
    if (!this.isCtlMounted) {
      return;
    }
    const hasStateChange = models
      .map((ns) => {
        const nextModelState = nextState[ns] as Record<string, unknown>;
        const preModelState = previousState[ns] as Record<string, unknown>;
        return this.isModelStateChange(ns, nextModelState, preModelState);
      })
      .reduce((previousValue, currentValue) => previousValue || currentValue);
    if (hasStateChange) {
      this.setState({
        // @ts-ignore
        _modelStateVersion: this.state._modelStateVersion + 1,
      });
    }
  };

  protected isModelStateChange = (modelNameSpace: string, nextModelState: Record<string, unknown>, preModelState: Record<string, unknown>) => {
    if (modelNameSpace === this.initManager.getNamespace()) {
      if (!this.props.match) {
        return false;
      }
      const matchedUrl = this.props.match.pathname;
      const nextUrlState = (nextModelState as ReactAppInitManager["state"])[matchedUrl];
      const preUrlState = (preModelState as ReactAppInitManager["state"])[matchedUrl];
      return nextUrlState?.initStatic !== preUrlState?.initStatic || nextUrlState?.init !== preUrlState?.init;
    } else {
      const depProps = this.modelStateDeps[modelNameSpace];
      if (!depProps?.length) {
        return false;
      }
      for (const depProp of depProps) {
        if (!preModelState || !nextModelState || preModelState[depProp] !== nextModelState[depProp]) {
          return true;
        }
      }
      return false;
    }
  };

  render(): ReactNode {
    const pathname = this.props.match?.pathname || this.location.pathname;
    const { initStatic, init } = this.initManager.getRouteInitState(pathname);

    // reset model state dep props
    this.modelStateDeps = {};
    this.isRendingView = true;
    if (!this.hasInjectProps || initStatic === ReactRouteInitStatus.LOADING) {
      return "loading...";
    }
    if (initStatic === ReactRouteInitStatus.ERROR) {
      return `controller ${this.constructor.prototype.name} init static model state failed`;
    }

    if (init === ReactRouteInitStatus.ERROR) {
      console.warn(`controller${this.constructor.prototype.name} init model state failed`);
    }

    const view = this.renderView();
    this.isRendingView = false;
    return view;
  }

  abstract renderView(): ReactNode;
}
