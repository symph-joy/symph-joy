import { Scope } from "./scope-options.interface";
import { Type } from "../type.interface";
import { TProviderName } from "./provider.interface";
import { Abstract } from "../abstract.interface";

export type ProviderInfo = { name: TProviderName[]; type: Type | Abstract; scope: Scope };

export interface IProviderInfoWare {
  setProviderInfo(info: ProviderInfo): void;
}

export function isProviderInfoWareProvider(provider: any): provider is IProviderInfoWare {
  return typeof provider?.setProviderInfo === "function";
}
