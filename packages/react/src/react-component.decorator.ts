import { ClassProvider, Component, Scope } from "@symph/core";

export interface ControllerMeta {
  path: string;
}

export interface PathVariable {
  key: string;
  type: string | number | boolean;
}

export function ReactComponent<T>(options: Partial<ClassProvider & ControllerMeta> = {}): <TFunction extends Function>(target: TFunction) => TFunction | void {
  return (constructor) => {
    const _options = Object.assign(
      // { type: ExtReactControllerDeco, useClass: ExtReactControllerDeco },
      {},
      options,
      { scope: Scope.TRANSIENT, autoLoad: "lazy" }
    );
    return Component(_options)(constructor);
  };
}
