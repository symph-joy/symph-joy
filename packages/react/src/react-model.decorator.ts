import { ClassProvider, Component } from "@symph/core";

export function ReactModel(options: Partial<ClassProvider> = {}): ClassDecorator {
  return (target) => {
    return Component(Object.assign({ autoLoad: "lazy" }, options))(target);
  };
}
