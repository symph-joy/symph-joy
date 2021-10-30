import { Scope } from "./scope-options.interface";
import { Type } from "../type.interface";
import { TProviderName } from "./provider.interface";
import { Abstract } from "../abstract.interface";
import { CoreContext } from "../../core-context";

export type ProviderInfo = { name: TProviderName; type: Type | Abstract; scope: Scope };

export interface IApplicationContextAware {
  setApplicationContext(coreContext: CoreContext): void;
}

export function isApplicationContextAwareComp(comp: any): comp is IApplicationContextAware {
  return typeof comp?.setApplicationContext === "function";
}
