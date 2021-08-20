import { HookType } from "./interface/hook.interface";
import { Type } from "../interfaces";

export interface IHookMeta {
  id: string;
  type: HookType;
  async: boolean;
  parallel: boolean;
  propKey: string | symbol;
}

export type AutowireHookOptions = Partial<Exclude<IHookMeta, "propKey">>;

const HOOKS_META_KEY = Symbol("joy-hooks");

export function AutowireHook(hookOptions?: AutowireHookOptions): PropertyDecorator {
  return (target, propertyKey) => {
    const hook: IHookMeta = Object.assign(
      {
        type: HookType.Traverse,
        async: true,
        parallel: false,
      },
      {
        id: propertyKey as string,
        propKey: propertyKey as string,
      },
      hookOptions
    );

    const existHooks = getHooksMetadata(target) || [];
    existHooks.push(hook);

    Reflect.defineMetadata(HOOKS_META_KEY, existHooks, target);
  };
}

export function getHooksMetadata(targetType: Object | Type): IHookMeta[] {
  return Reflect.getMetadata(HOOKS_META_KEY, typeof targetType === "function" ? targetType.prototype : targetType) as IHookMeta[];
}
