import { Scope } from "./scope-options.interface";
import { Type } from "../type.interface";
import { ComponentName } from "./component.interface";
import { Abstract } from "../abstract.interface";
import { ApplicationContext } from "../../application-context";

export type ProviderInfo = { name: ComponentName; type: Type | Abstract; scope: Scope };

export interface IApplicationContextAware {
  setApplicationContext(coreContext: ApplicationContext): void;
}

export function isApplicationContextAwareComp(comp: any): comp is IApplicationContextAware {
  return typeof comp?.setApplicationContext === "function";
}
