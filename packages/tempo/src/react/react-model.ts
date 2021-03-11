import { Inject } from "../decorators/core";
import { ReduxStore } from "./redux/redux-store";
import {
  IProviderInfoWare,
  ProviderInfo,
} from "../interfaces/context/provider-info-ware.interface";

export interface ProviderLifecycle {
  afterPropertiesSet?(): void;
}

export abstract class ReactModel<TState>
  implements ProviderLifecycle, IProviderInfoWare {
  public getNamespace(): string | undefined {
    return this._namespace;
  }

  public setNamespace(namespace: string): void {
    this._namespace = namespace;
  }

  public abstract getInitState(): TState;

  @Inject()
  private reduxStory: ReduxStore;

  private _namespace: string;

  afterPropertiesSet?(): void {
    const initState = this.getInitState();
    this.reduxStory.registerModel(this, initState);
  }

  setProviderInfo({ name }: ProviderInfo): void {
    this._namespace = name;
  }

  public get state(): TState {
    return this.reduxStory.store.getState()[this.getNamespace()];
  }

  protected setState(nextState: Partial<TState>) {
    const action = {
      type: this.getNamespace() + "/__SET_STATE",
      nextState,
    };
    return this.reduxStory.store.dispatch(action);
  }

  static isModel(obj): obj is ReactModel<unknown> {
    return obj instanceof ReactModel;
  }
}
