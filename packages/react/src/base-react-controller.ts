import React, { Component, ReactNode } from "react";
import { ReactApplicationReactContext } from "./react-app-container";
import { ModelStateChangeHandler, ReactReduxService } from "./redux/react-redux.service";
import { BaseReactModel } from "./base-react-model";
import { bindRouteFromCompProps } from "./router/react-route.decorator";
import { IApplicationContext, IInjectableDependency, Inject } from "@symph/core";
import { IInitialModelState, ReactAppInitManager, ReactRouteInitStatus } from "./react-app-init-manager";
import type { Location } from "history";
import { IReactRoute } from "./interfaces";
import { NavigateFunction, PathMatch } from "react-router";
import { ReactContext } from "./react-controller.decorator";

export type ControllerBaseStateType = {
  _modelStateVersion: number;
  [keys: string]: unknown;
};

export interface BaseReactController extends IInitialModelState {
  onInitialModelStaticStateDid?(): void;
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

  @ReactContext(ReactApplicationReactContext)
  protected appContext: IApplicationContext;

  protected reduxStore: ReactReduxService;
  protected isCtlMounted: boolean;

  protected _models: Array<BaseReactModel<unknown>>;

  protected hasInitInvoked = false;
  private hasInjectProps = false;

  /**
   * 注入 initManager， 以便监听initManager中的状态
   * @protected
   */
  @Inject()
  protected initManager: ReactAppInitManager;

  protected location: Location;

  public async prepareComponent(): Promise<any> {}

  private isRendingView = false;
  private modelStateDeps: Record<string, string[]> = {};

  private isWaitingInitStaticDid = true;

  constructor(props: TProps, context: TContext) {
    super(props as any, context);
    this.isCtlMounted = false;

    const contextValues = (props as any).__ctx_values;
    if (contextValues) {
      for (const propKey of Object.keys(contextValues)) {
        (this as any)[propKey] = contextValues[propKey];
      }
    }

    this.reduxStore = this.appContext.getSync(ReactReduxService)!;
  }

  _patch_shouldComponentUpdate(nextProps: Readonly<TProps>, nextState: Readonly<TState>, nextContext: any): boolean {
    this.bindProps(nextProps);
    return true;
  }

  _patch_pre_componentDidMount(): void {
    this.isCtlMounted = true;
    const { initStatic } = this.getInitState();
    if (this.isWaitingInitStaticDid && initStatic === ReactRouteInitStatus.SUCCESS) {
      this.triggerOnInitialModelStaticStateDid();
    }
  }

  _patch_componentWillUnmount(): void {
    this.isCtlMounted = false;
    let pathname: string = this.props.match?.pathname || this.location.pathname;
    this.initManager.unregisterRouteController(pathname, this);
    if (this._models) {
      this.reduxStore.rmModelStateListener(
        this._models.map((it) => it.getNamespace()),
        this.modelStateListener
      );
    }
    this.initManager.resetInitState(pathname);
  }

  protected bindProps(props: TProps) {
    this.location = this.props.location!;
    bindRouteFromCompProps(this, props);
  }

  private triggerOnInitialModelStaticStateDid() {
    this.isWaitingInitStaticDid = false;
    if (typeof window !== "undefined" && typeof this.onInitialModelStaticStateDid === "function") {
      this.onInitialModelStaticStateDid();
    }
  }

  protected async init(): Promise<void> {
    if (this.hasInitInvoked) {
      throw new Error("Controller init twice");
    }
    this.hasInitInvoked = true;

    this.injectProps();
    this.bindProps(this.props);

    if (typeof (this as any).initialize === "function") {
      (this as any).initialize();
    }

    this.state = {
      ...this.state,
      _modelStateVersion: 1,
    };

    let pathname: string = this.props.match?.pathname || this.location.pathname;
    this.initManager.registerRouteController(pathname, this);

    // let pathname: string = this.props.match?.pathname || this.location.pathname;
    // const initStage = this.initManager.initStage;
    // const { initStatic, init } = this.getInitState();

    // if (initStage >= EnumReactAppInitStage.STATIC) {
    //   if (initStatic === undefined || initStatic === ReactRouteInitStatus.NONE || initStatic === ReactRouteInitStatus.ERROR) {
    //     if (this.initialModelStaticState) {
    //       const initStaticTask = Promise.resolve(this.initialModelStaticState({}))
    //         .then((rst) => {
    //           this.setInitState({
    //             initStatic: ReactRouteInitStatus.SUCCESS,
    //           });
    //           return rst;
    //         })
    //         .catch((e) => {
    //           console.error(e);
    //           this.setInitState({
    //             initStatic: ReactRouteInitStatus.ERROR,
    //           });
    //         });
    //       if (typeof window === "undefined" && initStaticTask) {
    //         // only on server side
    //         this.initManager.addTask(pathname, initStaticTask);
    //       }
    //     } else {
    //       this.setInitState({
    //         initStatic: ReactRouteInitStatus.SUCCESS,
    //       });
    //     }
    //   } else if (initStatic === ReactRouteInitStatus.SUCCESS) {
    //     // noop
    //   } else if (initStatic === ReactRouteInitStatus.LOADING) {
    //     // 数据由外部加载，例如加载预渲染的数据时。noop
    //   }
    //   this.isWaitingInitStaticDid = true;
    // }
    //
    // if (initStage >= EnumReactAppInitStage.DYNAMIC) {
    //   if (init === undefined || init === ReactRouteInitStatus.NONE || init === ReactRouteInitStatus.ERROR) {
    //     if (this.initialModelState) {
    //       const initTask = Promise.resolve(this.initialModelState({}))
    //         // .then((rst) => {
    //         //   this.setInitState( {
    //         //     init: ReactRouteInitStatus.SUCCESS,
    //         //   });
    //         //   return rst;
    //         // })
    //         .catch((e) => {
    //           this.setInitState({
    //             init: ReactRouteInitStatus.ERROR,
    //           });
    //         });
    //       if (typeof window == "undefined" && initTask) {
    //         // only on server side
    //         this.initManager.addTask(pathname, initTask);
    //       }
    //     } else {
    //       // this.setInitState( {
    //       //   init: ReactRouteInitStatus.SUCCESS,
    //       // });
    //     }
    //   }
    // }
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
      const nextInitState = (nextModelState as ReactAppInitManager["state"])[matchedUrl];
      const preInitState = (preModelState as ReactAppInitManager["state"])[matchedUrl];
      if (this.isWaitingInitStaticDid && nextInitState?.initStatic === ReactRouteInitStatus.SUCCESS) {
        this.triggerOnInitialModelStaticStateDid();
      }
      return nextInitState?.initStatic !== preInitState?.initStatic || nextInitState?.init !== preInitState?.init;
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

  protected getInitState() {
    const pathname = this.props.match?.pathname || this.location?.pathname || "/";
    const index = !!this.props.route?.index;
    const initState = this.initManager.getRouteInitState({ pathname, index });
    return initState;
  }

  protected setInitState({ initStatic, init }: { initStatic?: ReactRouteInitStatus; init?: ReactRouteInitStatus }) {
    const pathname = this.props.match?.pathname || this.location.pathname;
    const index = !!this.props.route?.index;
    this.initManager.setInitState({ pathname, index }, { initStatic, init });
  }

  render(): ReactNode {
    const { initStatic, init } = this.getInitState();

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
