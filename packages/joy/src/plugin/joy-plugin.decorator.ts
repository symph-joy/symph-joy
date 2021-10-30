import { Component, ComponentOptions } from "@symph/core";
import { IJoyPlugin } from "./joy-plugin.interface";
import { Configurable } from "@symph/config";

export function JoyPlugin(options: ComponentOptions & Partial<IJoyPlugin> = {}): ClassDecorator {
  return (target) => {
    // === 注册可被注入的配置项
    Configurable(options)(target);

    //=== 注册为provider
    Component(options)(target);
  };
}
