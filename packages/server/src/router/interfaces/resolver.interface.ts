import { InstanceWrapper, TProviderName } from "@symph/core";

export interface Resolver {
  resolve(instance: any, basePath: string, wrappers?: InstanceWrapper[]): void;
  registerNotFoundHandler(): void;
  registerExceptionHandler(): void;
}
