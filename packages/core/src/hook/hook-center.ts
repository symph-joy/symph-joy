import {AsyncParallelHook, AsyncParallelBailHook, AsyncSeriesHook, AsyncSeriesWaterfallHook, AsyncSeriesBailHook, SyncHook, SyncBailHook, SyncWaterfallHook, AsyncHook} from "tapable";
import {HookType, IHook} from "./interface/hook.interface";
import {RuntimeException} from "../errors/exceptions/runtime.exception";
import {ITap} from "./interface/tap.interface";
import {Abstract, Provider, TProviderName, Type} from "../interfaces";
import {getHooksMetadata, IHookMeta} from "./autowire-hook.decorator";
import {getTapsMetadata} from "./register-tap.decorator";
import {ComponentWrapper} from "../injector";
import {Hook} from "./hook";

type RegisterHookOptions = {
  id: string;
  type: HookType;
  async: boolean;
  parallel: boolean;
};

export class HookCenter {
  private hooks: Map<string, IHook> = new Map<string, IHook>();
  // 这会导致transient类型的provider内存泄露，永远无法自动释放，所以在transient类型的provider中注册的tap，需要手动调用`unregisterTag()`手动释放
  private _tapCache: Map<Object, Array<string>> = new Map<Object, Array<string>>();

  public registerHooksFromWrappers(wrappers: ComponentWrapper[]) {
    const hooks = new Array<IHook>();
    for (const wrapper of wrappers) {
      const wrapperHooks = this.registerHooksFromWrapper(wrapper);
      if (wrapperHooks && wrapperHooks.length) {
        hooks.push(...wrapperHooks);
      }
    }
    return hooks;
  }

  public registerHooksFromWrapper(wrapper: ComponentWrapper): IHook[] | undefined {
    const type = wrapper.type;
    if (type === Object) {
      return;
    }
    const hookMetas = getHooksMetadata(type);
    if (hookMetas === undefined || hookMetas.length === 0) {
      return;
    }
    const hooks = new Array<IHook>();

    for (let i = 0; i < hookMetas.length; i++) {
      const hookMeta = hookMetas[i];
      const hookInfo = {
        ...hookMeta,
        // host: wrapper.name[0],
      };
      const pipe = this.registerHook(hookInfo);
      hooks.push(pipe);
    }
    return hooks;
  }

  public registerHook(hookInfo: RegisterHookOptions): IHook {
    const _hook = this.hooks.get(hookInfo.id);
    if (_hook) {
      // todo 只有两者相同才能兼容。
      // return _hook
      throw new RuntimeException(`Error: Duplicate register hook(${hookInfo.id})`);
    }

    const {id, type, async, parallel} = hookInfo;
    const hook = new Hook(id, type, async, parallel);
    this.hooks.set(id, hook);
    return hook;
  }

  public registerProviderHooks<T extends Object>(provider: T, providerType?: Type<T> | Abstract<T>): IHook[] | undefined {
    const type = providerType || provider.constructor;
    const hookMetas = getHooksMetadata(type);
    if (hookMetas === undefined || hookMetas.length === 0) {
      return undefined;
    }
    const registeredHooks = new Array<IHook>();
    for (let i = 0; i < hookMetas.length; i++) {
      const hookMeta = hookMetas[i];
      const existHook = (provider as any)[hookMeta.propKey];
      if (existHook) {
        // 已经注册了hook实例，则继续使用已注册的hook。
        if (existHook.id !== hookMeta.id) {
          throw new RuntimeException(`Instance hook id(${existHook}) is not equal to @Hook() defines id(${hookMeta.id})`);
        }
      }
      let hook = existHook || this.hooks.get(hookMeta.id);
      if (!hook) {
        hook = this.registerHook(hookMeta);
      }

      registeredHooks.push(hook as Hook);
      (provider as any)[hookMeta.propKey] = hook;
    }
    return registeredHooks;
  }

  //todo implement unregisterProviderHooks()

  public registerProviderTaps<T extends Object>(provider: T, providerType?: Type<T> | Abstract<T>): ITap[] {
    const taps = new Array<ITap>();
    const type = providerType || provider.constructor;
    const tapMetas = getTapsMetadata(type);
    if (tapMetas === undefined || tapMetas.length === 0) {
      return taps;
    }
    for (let i = 0; i < tapMetas.length; i++) {
      const tapMeta = tapMetas[i];
      const tap: ITap = {
        ...tapMeta,
        provider,
      };
      this.registerTap(tapMeta.hookId, tap);
      taps.push(tap);
    }
    return taps;
  }

  public registerTap(hookId: string, tap: ITap): void {
    const hook = this.hooks.get(hookId);
    if (hook === undefined) {
      throw new RuntimeException(`Register provider's tap failed, the hook(${hookId}) is not found, the provider is : ${tap.provider?.constructor?.name}`);
    }
    hook.registerTap(tap);

    this._tapCache.set(tap.provider, [hookId]);
  }

  public unregisterProviderTaps(provider: Object): ITap[] {
    const removedTaps: ITap[] = [];
    const hookIds = this._tapCache.get(provider);
    if (!hookIds || hookIds.length == 0) {
      return removedTaps;
    }
    for (let i = 0; i < hookIds.length; i++) {
      const tap = this.unregisterProviderTap(provider, hookIds[i]);
      tap && removedTaps.push(tap);
    }
    return removedTaps;
  }

  public unregisterProviderTap<T>(provider: T, hookId: string): ITap | undefined {
    const hook = this.hooks.get(hookId);
    if (!hook) {
      return undefined;
    }
    hook.unregisterProviderTap(provider);
  }

  public applyHook(hookId: string, args?: any, initialValue?: any): any {
    const hook = this.hooks.get(hookId);
    if (hook === undefined) {
      throw new RuntimeException(`Can not apply hook(${hookId}), the hook is not registered.`);
    }

    return hook.call(initialValue);
  }
}
