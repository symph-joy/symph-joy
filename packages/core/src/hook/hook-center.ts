import * as tapable from "tapable";
import { HookType, IHook } from "./interface/hook.interface";
import { RuntimeException } from "../errors/exceptions/runtime.exception";
import { ITap } from "./interface/tap.interface";
import { Type } from "../interfaces";
import { getHooksMetadata } from "./hook.decorator";
import { getTapsMetadata } from "./tap.decorator";

export interface HookPipe extends IHook {
  hook: tapable.Hook;
  call:
    | typeof tapable.Hook.prototype.call
    | typeof tapable.Hook.prototype.promise; // todo 添加入参类型申明
}

export class HookCenter {
  private hooks: Map<string, HookPipe> = new Map<string, HookPipe>();
  // 这会导致transient类型的provider内存泄露，永远无法自动释放，所以在transient类型的provider中注册的tap，需要手动调用`unregisterTag()`手动释放
  private _tapCache: Map<Object, Array<string>> = new Map<
    Object,
    Array<string>
  >();

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

  private getHookClazz(
    type: HookType,
    async: boolean,
    parallel: boolean
  ): { new (...args: any[]): tapable.Hook } {
    let hookClazz: { new (...args: any[]): tapable.Hook } | undefined;
    if (async) {
      if (parallel) {
        switch (type) {
          case HookType.Traverse:
            hookClazz = tapable.AsyncParallelHook;
            break;
          case HookType.Bail:
            hookClazz = tapable.AsyncParallelBailHook;
            break;
          case HookType.Waterfall:
            throw new RuntimeException(
              `can not set waterfall hook run parallel`
            );
        }
      } else {
        switch (type) {
          case HookType.Traverse:
            hookClazz = tapable.AsyncSeriesHook;
            break;
          case HookType.Bail:
            hookClazz = tapable.AsyncSeriesWaterfallHook;
            break;
          case HookType.Waterfall:
            hookClazz = tapable.AsyncSeriesBailHook;
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
            hookClazz = tapable.SyncHook;
            break;
          case HookType.Bail:
            hookClazz = tapable.SyncBailHook;
            break;
          case HookType.Waterfall:
            hookClazz = tapable.SyncWaterfallHook;
        }
      }
    }
    if (!hookClazz) {
      throw new RuntimeException("");
    }
    return hookClazz;
  }

  public registerHook(hookMeta: IHook): HookPipe {
    const _hook = this.hooks.get(hookMeta.id);
    if (_hook) {
      throw new RuntimeException(`duplicate register hook(${hookMeta.id})`);
    }

    const { id, type, async, parallel, hook } = hookMeta;
    let hookPoint = hook;
    if (hookPoint === undefined) {
      try {
        const hookClazz = this.getHookClazz(type, async, parallel);
        hookPoint = new hookClazz(["memo", "args"]);
      } catch (e) {
        throw new RuntimeException(
          `can not init hook(${id}) instance, because of: ${e.message}`
        );
      }
    }
    const callMethod = async ? hookPoint.promise : hookPoint.call;
    const pipe: HookPipe = {
      ...hookMeta,
      hook: hookPoint,
      call: callMethod.bind(hookPoint),
    };
    this.hooks.set(id, pipe);
    return pipe;
  }

  public registerProviderHooks<T extends Object>(
    provider: T,
    providerType?: Type<T>
  ): HookPipe[] {
    const hookPipes = new Array<HookPipe>();
    const type = providerType || provider.constructor;
    const hookMetas = getHooksMetadata(type);
    if (hookMetas === undefined || hookMetas.length === 0) {
      return hookPipes;
    }
    for (let i = 0; i < hookMetas.length; i++) {
      const hook = hookMetas[i];
      const pipe = this.registerHook(hook);
      hookPipes.push(pipe);
      // @ts-ignore
      provider[hook.propKey] = pipe;
    }
    return hookPipes;
  }

  //todo implement unregisterProviderHooks()

  public registerProviderTaps<T extends Object>(
    provider: T,
    providerType?: Type<T>
  ): ITap[] {
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
      throw new RuntimeException(
        `register tap failed, hook(${hookId}) is not found`
      );
    }
    const { provider, propKey } = tap;
    const tapMethod = hook.async ? "tapPromise" : "tap";
    hook.hook[tapMethod](
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

  public unregisterProviderTap<T>(
    provider: T,
    hookId: string
  ): ITap | undefined {
    const hook = this.hooks.get(hookId);
    if (!hook) {
      return undefined;
    }
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
      throw new RuntimeException(
        `can not apply hook(${hookId}), it is undefined`
      );
    }

    return hook.hook.promise(initialValue);
  }
}
