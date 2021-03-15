import React, { ReactNode, Component } from "react";
import { JoyReactContext } from "./react-app-container";
import { ModelStateChangeHandler, ReduxStore } from "./redux/redux-store";
import { ReactModel } from "./react-model";
import { PathVariable } from "./react-controller.decorator";
import {
  bindRouteFromCompProps,
  getRouteMeta,
} from "./router/react-route.decorator";
import { IInjectableDependency, IJoyContext } from "@symph/core";
import { IReactRoute } from "./interfaces";

export type ControllerBaseStateType = {
  _modelStateVersion: number;
  [keys: string]: unknown;
};

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

  /**
   * 获取预渲染的状态
   */
  async getStaticInitialModelState(): Promise<Record<string, any>> {
    return {};
  }

  /**
   * 获取绑定model中的初始化状态。
   * @param context
   */
  async getInitialModelState(context: any): Promise<void> {}

  /**
   * 向后兼容：
   * 进行组件渲染的的准备工作，可以在服务端和浏览器上运行,
   * @param context
   */
  async componentPrepare(context: any): Promise<void> {}

  static contextType = JoyReactContext;
  protected appContext: IJoyContext;
  protected reduxStore: ReduxStore;
  protected isCtlMounted: boolean;
  protected routeMeta?: IReactRoute;

  private hasInitInvoked = false;
  private hasInjectProps = false;

  public async prepareComponent(): Promise<any> {}

  constructor(props: TProps, context: TContext) {
    super(props, context);
    // this.hasInitInvoked = false;
    // this.hasInjectProps = false;
    this.isCtlMounted = false;
    this.appContext = context;
    this.reduxStore = this.appContext.syncGetProvider(ReduxStore)!;

    this.routeMeta = getRouteMeta(this.constructor);
    if (this.routeMeta) {
      bindRouteFromCompProps(this, this.props);
    }
  }

  protected init(): void {
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
    if (!this.hasInjectProps) {
      return "loading...";
    }
    return this.renderView();
  }

  abstract renderView(): ReactNode;

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
    // todo  移除事件监听
  }
}
