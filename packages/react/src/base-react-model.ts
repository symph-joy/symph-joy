import { ReactReduxService } from "./redux/react-redux.service";
import { Autowire, IComponentInfoAware, ComponentAwareInfo, IComponentLifecycle, RuntimeException, TProviderName } from "@symph/core";
import { Action } from "redux";

export abstract class BaseReactModel<TState> implements IComponentLifecycle, IComponentInfoAware {
  public getNamespace(): string {
    return this._namespace;
  }

  public setNamespace(namespace: string): void {
    this._namespace = namespace;
  }

  public abstract getInitState(): TState;

  @Autowire()
  private reduxStore: ReactReduxService;

  private _namespace: string;

  initialize(): void {
    const initState = this.state || this.getInitState();
    this.reduxStore.registerModel(this, initState);
  }

  setProviderInfo({ name }: ComponentAwareInfo): void {
    if (this._namespace) {
      return;
    }
    const providerName = name;
    if (!providerName || typeof providerName !== "string") {
      throw new RuntimeException(`If model namespace is not defined, the provider name must be a string,
       and will be used as it's namespace. the current get provider name is ${String(name)}).`);
    }
    this._namespace = providerName;
  }

  public get state(): TState {
    return this.reduxStore.store.getState()[this.getNamespace()];
  }

  protected setState(nextState: Partial<TState>): void {
    const action = {
      type: this.getNamespace() + "/__SET_STATE",
      state: nextState,
    };
    this.reduxStore.store.dispatch(action);
  }

  static isModel(obj: unknown): obj is BaseReactModel<unknown> {
    return obj instanceof BaseReactModel;
  }
}
