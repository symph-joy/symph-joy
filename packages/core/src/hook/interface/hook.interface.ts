import * as tapable from "tapable";

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
  hook?: tapable.Hook;
}
