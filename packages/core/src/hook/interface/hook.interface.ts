import { ITap } from "./tap.interface";

export enum HookType {
  Traverse,
  Waterfall,
  Bail,
}

type AsArray<T> = T extends any[] ? T : [T];

export interface IHook<TCallArgs = any, TCallReturn = any> {
  id: string;
  type: HookType;
  async: boolean;
  parallel: boolean;
  call: (...args: AsArray<TCallArgs>) => TCallReturn | Promise<TCallReturn>; // todo 添加入参类型申明

  registerTap(tap: ITap): void;
  unregisterProviderTap<T>(provider: T): ITap | undefined;

  isDisposed: boolean;
  dispose: () => void;
}
