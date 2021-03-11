import { Scope } from "./scope-options.interface";
import { Type } from "../type.interface";

export type ProviderInfo = { name: string; type: Type; scope: Scope };

export interface IProviderInfoWare {
  setProviderInfo(info: ProviderInfo): void;
}

export function isProviderInfoWareProvider(
  provider: any
): provider is IProviderInfoWare {
  return typeof provider?.setProviderInfo === "function";
}
