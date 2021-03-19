import { ClassProvider, Injectable, Type } from "@symph/core";

export function CommandProvider(
  options: Partial<ClassProvider> = {}
): <TFunction extends Function>(target: TFunction) => TFunction | void {
  return (target) => {
    Reflect.defineMetadata("__joy_cmd", options, target);
    Injectable(options)(target);
  };
}

export function getCommandMetadata(targetType: Object | Type): any {
  return Reflect.getMetadata("__joy_cmd", targetType);
}