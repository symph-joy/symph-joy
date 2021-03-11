import { ClassProvider } from "../interfaces/context/provider.interface";
import { Injectable } from "../decorators/core";

// eslint-disable-next-line @typescript-eslint/ban-types
export function Controller<T>(
  options: Partial<ClassProvider> = {}
): <TFunction extends Function>(target: TFunction) => TFunction | void {
  return (constructor) => {
    class Ext extends (constructor as any) {
      constructor(...args) {
        super(...args);
        if (typeof this.init === "function") {
          this.init();
        }
      }
    }

    Injectable(options)(constructor);

    return (Ext as unknown) as typeof constructor;
  };
}
