import { ClassProvider, Component, ComponentOptions, Scope, Type } from "@symph/core";

export const META_KEY_REACT_COMPONENT = Symbol("react-component");

export function ReactComponent(options?: ComponentOptions): ClassDecorator {
  return (constructor) => {
    const _options = Object.assign({ autoRegister: true }, options);

    Reflect.defineMetadata(META_KEY_REACT_COMPONENT, true, constructor);

    return Component(_options)(constructor);
  };
}

export function isReactComponent(clazz: Object): clazz is Type {
  return Reflect.getMetadata(META_KEY_REACT_COMPONENT, clazz as any);
}
