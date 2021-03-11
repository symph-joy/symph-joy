import { HookType, IHook } from "./interface/hook.interface";
import { Type } from "../interfaces";

export interface IHookDecoMeta<T = any> extends IHook {
  propKey: keyof T;
}

const defaultHook = {
  type: HookType.Traverse,
  async: true,
  parallel: false,
};

export function Hook(hookOptions?: Partial<IHook>): PropertyDecorator {
  return (target, propertyKey) => {
    const hook: IHookDecoMeta = Object.assign(
      {},
      defaultHook,
      {
        id: propertyKey as string,
        propKey: propertyKey as string,
      },
      hookOptions
    );

    const existHooks = getHooksMetadata(target) || [];
    existHooks.push(hook);

    Reflect.defineMetadata("__joy_hooks", existHooks, target);
  };
}

export function getHooksMetadata(targetType: Object | Type): IHookDecoMeta[] {
  return Reflect.getMetadata(
    "__joy_hooks",
    typeof targetType === "function" ? targetType.prototype : targetType
  ) as IHookDecoMeta[];
}
