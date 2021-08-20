import { ReactReduxService } from "./redux/react-redux.service";
import { Inject, IProviderInfoWare, ProviderInfo, ProviderLifecycle, RuntimeException, TProviderName } from "@symph/core";
import { Action } from "redux";

export abstract class ReactModel<TState> implements ProviderLifecycle, IProviderInfoWare {
  public getNamespace(): string {
    return this._namespace;
  }

  public setNamespace(namespace: string): void {
    this._namespace = namespace;
  }

  public abstract getInitState(): TState;

  @Inject()
  private reduxStore: ReactReduxService;

  private _namespace: string;

  afterPropertiesSet(): void {
    const initState = this.state || this.getInitState();
    this.reduxStore.registerModel(this, initState);
  }

  setProviderInfo({ name }: ProviderInfo): void {
    if (this._namespace) {
      return;
    }
    const providerName = name.find((it) => typeof it === "string");
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
      nextState,
    };
    this.reduxStore.store.dispatch(action);
  }

  static isModel(obj: unknown): obj is ReactModel<unknown> {
    return obj instanceof ReactModel;
  }
}
