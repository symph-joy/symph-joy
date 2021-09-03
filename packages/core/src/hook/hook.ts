import { HookType, IHook } from "./interface/hook.interface";
import { AsyncHook, AsyncParallelBailHook, AsyncParallelHook, AsyncSeriesBailHook, AsyncSeriesHook, AsyncSeriesWaterfallHook, Hook as TapableHook, SyncBailHook, SyncHook, SyncWaterfallHook } from "tapable";
import { RuntimeException } from "../errors";
import { ITap } from "./interface/tap.interface";

type THookAny = TapableHook<unknown, unknown>;

type AsArray<T> = T extends any[] ? T : [T];

export class Hook<TCallArgs = any, TCallReturn = any> implements IHook {
  private readonly hookPoint: TapableHook<TCallArgs, TCallReturn>;

  public _isDisposed = false;

  public get isDisposed(): boolean {
    return this._isDisposed;
  }

  constructor(public readonly id: string, public readonly type: HookType, public readonly async = true, public readonly parallel = false) {
    try {
      const hookClazz = this.getTapableHookClazz(type, async, parallel);
      this.hookPoint = new hookClazz(["memo", "args"]) as any;
    } catch (e) {
      throw new RuntimeException(`Can not init hook(${id}) instance, because of: ${e.message}`);
    }
  }

  public getTapableHook(): THookAny {
    return this.hookPoint;
  }

  public call(...args: AsArray<TCallArgs>): TCallReturn | Promise<TCallReturn> {
    if (this._isDisposed) {
      console.warn("Call a disposed hook, this will do nothing.");
    }
    if (this.async) {
      return (this.hookPoint as AsyncHook<TCallArgs, TCallReturn>).promise(...args);
    } else {
      return (this.hookPoint as SyncHook<TCallArgs, TCallReturn>).call(...args);
    }
  }

  public dispose(): void {
    this._isDisposed = true;
    (this.hookPoint as any).taps = [];
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

  public registerTap(tap: ITap): void {
    if (this._isDisposed) {
      console.warn("Try to register a tag to a hook, which is disposed, this will do nothing.");
    }

    const { provider, propKey } = tap;
    const tapMethod = this.async ? "tapPromise" : "tap";
    (this.hookPoint as any)[tapMethod](
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
        if (this.async && !(result instanceof Promise)) {
          return Promise.resolve(result);
        }
        return result;
      }
    );
  }

  public unregisterProviderTap<T>(provider: T): ITap | undefined {
    // @ts-ignore
    const taps = this.hookPoint.taps;
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
}
