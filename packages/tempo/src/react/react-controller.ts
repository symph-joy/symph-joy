import React, { ReactNode } from "react";
import { IJoyContext } from "../interfaces";
import { TempoContext } from "./application-component";
import { ModelStateChangeHandler, ReduxStore } from "./redux/redux-store";
import { Dependency } from "../interfaces/dependency.interface";
import { ReactModel } from "./react-model";
import { PROPERTY_DEPS_METADATA } from "../constants";
import { string } from "prop-types";

export type ControllerBaseStateType = {
  _modelStateVersion: number;
  [keys: string]: unknown;
};

/**
 * todo model 状态发生改变后，如何判断是否有必要刷新组件？
 */
export abstract class ReactController<
  TProps = Record<string, unknown>,
  TState = Record<string, unknown>,
  TContext = IJoyContext
> extends React.Component<TProps, TState | ControllerBaseStateType, TContext> {
  __proto__: typeof React.Component;

  static contextType = TempoContext;
  protected appContext: IJoyContext;
  protected reduxStore: ReduxStore;
  protected isCtlMounted: boolean;

  private isInitialized = false;

  public async prepareComponent(): Promise<any> {}

  protected constructor(props, context) {
    super(props, context);
    this.isInitialized = false;
    this.isCtlMounted = false;
    this.appContext = context;
    this.reduxStore = this.appContext.syncGetProvider(ReduxStore);
    // this.injectProps()
  }

  protected init(): void {
    this.injectProps();
    this.state = {
      ...this.state,
      _modelStateVersion: 1,
    };

    // prepare component
  }

  /**
   * !import： must called in subclass of constructor
   * @private
   */
  private injectProps(): void {
    const controllerType = this.__proto__.constructor;
    const injectedProps = this.appContext.resolveProperties(
      this,
      controllerType
    );
    if (injectedProps instanceof Promise) {
      this.isInitialized = false;
      injectedProps.then((props) => {
        this.registersModel(props);
        this.isInitialized = true;
      });
    } else {
      this.registersModel(injectedProps);
      this.isInitialized = true;
    }
  }

  private registersModel(propDeps: Dependency[]) {
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
        this.modelChangeListener
      );
    }
  }

  protected modelChangeListener: ModelStateChangeHandler = (
    models,
    nextState,
    previousState
  ) => {
    if (!this.isCtlMounted) {
      return;
    }
    this.setState({
      _modelStateVersion:
        (this.state as ControllerBaseStateType)._modelStateVersion + 1,
    });
  };

  render(): ReactNode {
    if (!this.isInitialized) {
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
    return true;
  }

  componentDidMount(): void {
    this.isCtlMounted = true;
    // todo  移除事件监听
  }
}
