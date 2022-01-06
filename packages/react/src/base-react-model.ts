import { ReactReduxService } from "./redux/react-redux.service";
import { Inject, IComponentInfoAware, ComponentAwareInfo, IComponentLifecycle, RuntimeException, ComponentName } from "@symph/core";
import warning from "./redux/utils/warning";
import isPlainObject from "./redux/utils/isPlainObject";

export abstract class BaseReactModel<TState> implements IComponentLifecycle, IComponentInfoAware {
  @Inject()
  private reactReduxService: ReactReduxService;

  public getNamespace(): string {
    return this._namespace;
  }

  public setNamespace(namespace: string): void {
    this._namespace = namespace;
  }

  public abstract getInitState(): TState;

  private _namespace: string;

  initialize(): void {
    const initState = this.state || (this.getInitState && this.getInitState());
    if (process.env.NODE_ENV !== "production") {
      if (initState) {
        function getType(obj: unknown): string {
          const match = Object.prototype.toString.call(obj).match(/\s([a-z|A-Z]+)/);
          return match ? match[1] : "";
        }
        if (!isPlainObject(initState)) {
          warning(`The ${this.getNamespace()} react model's initState has unexpected type of "${getType(initState)}"`);
        }
        const props = Object.keys(initState);
        for (const prop of props) {
          const propValue = (initState as any)[prop];
          if (propValue === undefined || propValue === null) {
            continue;
          }
          const propType = typeof propValue;
          if (propType === "object" && !Array.isArray(propValue) && !isPlainObject(propValue)) {
            warning(
              `The "${prop}" prop has unexpected type of "${getType(
                propValue
              )}", on ${this.getNamespace()} react model's initState, it expect a plain object.`
            );
          } else if (propType === "function") {
            warning(`The "${prop}" prop has unexpected type of "function", on ${this.getNamespace()} react model's initState`);
          }
        }
      }
    }
    this.reactReduxService.registerModel(this, initState);
  }

  setProviderInfo({ name }: ComponentAwareInfo): void {
    if (this._namespace) {
      return;
    }
    const providerName = name;
    if (!providerName || typeof providerName !== "string") {
      throw new RuntimeException(`The ${String(name)}) has unexpected type of "${typeof providerName}". The component name must be a string,
       and it will be used as model's namespace. `);
    }
    this._namespace = providerName;
  }

  public get state(): TState {
    return this.reactReduxService.store.getState()[this.getNamespace()];
  }

  protected setState(nextState: Partial<TState>): void {
    const action = {
      type: this.getNamespace() + "/__SET_STATE",
      state: nextState,
    };
    this.reactReduxService.store.dispatch(action);
  }

  static isModel(obj: unknown): obj is BaseReactModel<unknown> {
    return obj instanceof BaseReactModel;
  }
}
