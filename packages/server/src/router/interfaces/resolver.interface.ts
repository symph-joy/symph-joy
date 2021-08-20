import { ComponentWrapper } from "@symph/core";

export interface Resolver {
  resolve(instance: any, basePath: string, wrappers?: ComponentWrapper[]): void;
  registerNotFoundHandler(): void;
  registerExceptionHandler(): void;
}
