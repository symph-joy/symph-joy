import { Hook, AsyncParallelHook, AsyncParallelBailHook, AsyncSeriesHook, AsyncSeriesWaterfallHook, AsyncSeriesBailHook, SyncHook, SyncBailHook, SyncWaterfallHook } from "tapable";
import { HookType, IHook } from "./interface/hook.interface";
import { RuntimeException } from "../errors/exceptions/runtime.exception";
import { ITap } from "./interface/tap.interface";
import { Abstract, Provider, TProviderName, Type } from "../interfaces";
import { getHooksMetadata, IHookMeta } from "./autowire-hook.decorator";
import { getTapsMetadata } from "./tap.decorator";
import { InstanceWrapper } from "../injector";

// export interface HookWrapper extends IHook {
//   hook?: Hook<any, any>;
//   hostName: TProviderName;  // host provider id
//   hostInstance?: object;  // host instance
//   call:  typeof SyncHook.prototype.call | typeof Hook.prototype.promise; // todo 添加入参类型申明
// }

type THookAny = Hook<unknown, unknown>;

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

  constructor() {
    // this.registerTap('afterPropertiesSet', {
    //   name: "plugin-center-resolve-hooks", propKey: 'afterPropertiesSet', provider: this
    //
    // })
  }

  // afterPropertiesSet() {
  //   console.log('>>>>  Plugin center afterPropertiesSet')
  // }

  // public resolveHooks(): void {
  //   const providerNames = this.container.getProviderNames()
  //   for (const name of providerNames) {
  //     const wrapper = this.container.getProviderByName(name)
  //     if (!wrapper) {
  //       continue
  //     }
  //     const type = wrapper.type
  //     const hookMetas = Reflect.getMetadata('_joy_hooks', type.prototype) as IHook[] | undefined
  //     if (hookMetas === undefined || hookMetas.length === 0) {
  //       return
  //     }
  //     for (const meta of hookMetas) {
  //       const hookPublisher = this.registerHook(meta)
  //     }
  //   }
  // }

  public registerHooksFromWrappers(wrappers: InstanceWrapper[]) {
    const hooks = new Array<IHook>();
    for (const wrapper of wrappers) {
      const type = wrapper.type;
      if (type === Object) {
        continue;
      }
      const hookMetas = getHooksMetadata(type);
      if (hookMetas === undefined || hookMetas.length === 0) {
        continue;
      }
      for (let i = 0; i < hookMetas.length; i++) {
        const hookMeta = hookMetas[i];
        const hookInfo = {
          ...hookMeta,
          host: wrapper.name[0],
        };
        const pipe = this.registerHook(hookInfo);
        hooks.push(pipe);
      }
    }
    return hooks;
  }

  private getTapableHookClazz(type: HookType, async: boolean, parallel: boolean): { new (...args: any[]): THookAny } {
    let hookClazz: { new (...args: any[]): THookAny } | undefined;
    if (async) {
      if (parallel) {
        switch (type) {
          case HookType.Traverse:
            hookClazz = AsyncParallelHook;
            break;
          case HookType.Bail:
            hookClazz = AsyncParallelBailHook;
            break;
          case HookType.Waterfall:
            throw new RuntimeException(`can not set waterfall hook run parallel`);
        }
      } else {
        switch (type) {
          case HookType.Traverse:
            hookClazz = AsyncSeriesHook;
            break;
          case HookType.Bail:
            hookClazz = AsyncSeriesBailHook;
            break;
          case HookType.Waterfall:
            hookClazz = AsyncSeriesWaterfallHook;
        }
      }
    } else {
      if (parallel) {
        switch (type) {
          case HookType.Traverse:
            throw new RuntimeException(`can not set sync hook run parallel`);
        }
      } else {
        switch (type) {
          case HookType.Traverse:
            hookClazz = SyncHook;
            break;
          case HookType.Bail:
            hookClazz = SyncBailHook;
            break;
          case HookType.Waterfall:
            hookClazz = SyncWaterfallHook;
        }
      }
    }
    if (!hookClazz) {
      throw new RuntimeException("");
    }
    return hookClazz;
  }

  public registerHook(hookInfo: RegisterHookOptions): IHook {
    const _hook = this.hooks.get(hookInfo.id);
    if (_hook) {
      throw new RuntimeException(`duplicate register hook(${hookInfo.id})`);
    }

    const { id, type, async, parallel } = hookInfo;
    let hookPoint: THookAny;
    try {
      const hookClazz = this.getTapableHookClazz(type, async, parallel);
      hookPoint = new hookClazz(["memo", "args"]);
    } catch (e) {
      throw new RuntimeException(`Can not init hook(${id}) instance, because of: ${e.message}`);
    }

    // @ts-ignore
    const callMethod = async ? hookPoint.promise : hookPoint.call;
    const pipe: IHook = {
      ...hookInfo,
      hook: hookPoint,
      call: callMethod.bind(hookPoint),
    };
    this.hooks.set(id, pipe);
    return pipe;
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
      let hook = this.hooks.get(hookMeta.id);
      if (!hook) {
        hook = this.registerHook(hookMeta);
        // throw new RuntimeException(`Can not register hook host instance, make sure the hook(id:${hookMeta.id}) has been registered.`)
      }
      registeredHooks.push(hook);
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
    const { provider, propKey } = tap;
    const tapMethod = hook.async ? "tapPromise" : "tap";
    (hook.hook as any)[tapMethod](
      {
        name: tap.id,
        stage: tap.stage,
        before: tap.before,
        // @ts-ignore
        provider: tap.provider,
        propKey: tap.propKey,
      },
      (memo: any[], args: any) => {
        // @ts-ignore
        const result = provider[propKey](memo, args);
        if (hook.async && !(result instanceof Promise)) {
          return Promise.resolve(result);
        }
        return result;
      }
    );

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
    // @ts-ignore
    const taps = hook.hook.taps;
    for (let i = 0; i < taps.length; i++) {
      // @ts-ignore
      if (taps[i].provider === provider) {
        const tap = taps[i];
        taps.splice(i, 1);
        return {
          id: tap.name,
          stage: tap.stage,
          before: tap.before,
          // @ts-ignore
          provider: tap.provider as T,
          // @ts-ignore
          propKey: tap.propKey as keyof T,
        };
      }
    }
  }

  public applyHook(hookId: string, args?: any, initialValue?: any): any {
    const hook = this.hooks.get(hookId);
    if (hook === undefined) {
      throw new RuntimeException(`Can not apply hook(${hookId}), the hook is not registered.`);
    }

    if (!hook.hook) {
      throw new RuntimeException(`Can not apply hook(${hookId}), the host is not instanced.`);
    }

    return hook.hook.promise(initialValue);
  }
}
