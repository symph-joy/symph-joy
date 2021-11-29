import { Component, ComponentOptions } from "@symph/core";
import { IJoyPlugin } from "./joy-plugin.interface";

export function JoyPlugin(options: ComponentOptions & Partial<IJoyPlugin> = {}): ClassDecorator {
  return (target) => {
    //=== 注册为provider
    Component(options)(target);
  };
}
