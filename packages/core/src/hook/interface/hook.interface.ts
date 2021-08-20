import { Hook, SyncHook } from "tapable";
import { TProviderName, TypeOrTokenType } from "../../interfaces";

export enum HookType {
  Traverse,
  Waterfall,
  Bail,
}

export interface IHook {
  id: string;
  type: HookType;
  async: boolean;
  parallel: boolean;
  hook: Hook<any, any>;
  call: typeof SyncHook.prototype.call | typeof Hook.prototype.promise; // todo 添加入参类型申明
}
