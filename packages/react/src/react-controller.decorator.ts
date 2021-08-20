import { ClassProvider, Component, Scope } from "@symph/core";

export interface ControllerMeta {
  path: string;
}

export interface PathVariable {
  key: string;
  type: string | number | boolean;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function ReactController<T>(options: Partial<ClassProvider & ControllerMeta> = {}): <TFunction extends Function>(target: TFunction) => TFunction | void {
  return (constructor) => {
    class ExtReactControllerDeco extends (constructor as any) {
      public wrapperComponent: typeof constructor;

      constructor(...args: any[]) {
        super(...args);
        this.wrapperComponent = constructor;
        if (typeof this.init === "function") {
          // todo 确保在子类中，只执行一次。
          this.init();
        }
      }

      static toString() {
        return constructor.toString();
      }

      static displayName = "RCTL_" + ((constructor as any).displayName || constructor.name);
    }

    // react-controller is instanced by react, so it's scope must be transient
    const clazzName = constructor.name;
    const name = clazzName.replace(clazzName[0], clazzName[0].toLowerCase());
    options = Object.assign(
      // { type: ExtReactControllerDeco, useClass: ExtReactControllerDeco },
      { name },
      options,
      { scope: Scope.TRANSIENT, autoLoad: false }
    );
    Component(options)(ExtReactControllerDeco);

    return (ExtReactControllerDeco as unknown) as typeof constructor;
  };
}
