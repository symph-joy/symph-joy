import { Scope } from "./scope-options.interface";
import { Type } from "../type.interface";
import { TProviderName } from "./provider.interface";
import { Abstract } from "../abstract.interface";

export type ComponentAwareInfo = { name: TProviderName; type: Type | Abstract; scope: Scope };

export interface IComponentInfoAware {
  setProviderInfo(info: ComponentAwareInfo): void;
}

export function isComponentInfoAwareComp(comp: any): comp is IComponentInfoAware {
  return typeof comp?.setProviderInfo === "function";
}
