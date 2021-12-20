import { Scope } from "./scope-options.interface";
import { Type } from "../type.interface";
import { ComponentName } from "./component.interface";
import { Abstract } from "../abstract.interface";

export type ComponentAwareInfo = { name: ComponentName; type: Type | Abstract; scope: Scope };

export interface IComponentInfoAware {
  setProviderInfo(info: ComponentAwareInfo): void;
}

export function isComponentInfoAwareComp(comp: any): comp is IComponentInfoAware {
  return typeof comp?.setProviderInfo === "function";
}
