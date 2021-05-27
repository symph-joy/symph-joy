import { ReactReduxService } from "./redux/react-redux.service";
import {
  Inject,
  IProviderInfoWare,
  ProviderInfo,
  ProviderLifecycle,
} from "@symph/core";
import { Action } from "redux";

export abstract class ReactModel<TState>
  implements ProviderLifecycle, IProviderInfoWare {
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
    this._namespace = name;
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
