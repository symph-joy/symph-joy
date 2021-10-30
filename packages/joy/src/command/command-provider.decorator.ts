import { Component, ComponentOptions, Type } from "@symph/core";

export function CommandProvider(options: ComponentOptions = {}): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata("__joy_cmd", options, target);
    Component(options)(target);
  };
}

export function getCommandMetadata(targetType: Object | Type): any {
  return Reflect.getMetadata("__joy_cmd", targetType);
}
