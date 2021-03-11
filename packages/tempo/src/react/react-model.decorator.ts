import { ClassProvider } from "../interfaces/context/provider.interface";
import { Injectable } from "../decorators/core";

export function Model(options: Partial<ClassProvider> = {}): ClassDecorator {
  return (target) => {
    return Injectable(Object.assign({ autoReg: true }, options))(target);
  };
}
