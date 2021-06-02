import { ClassProvider, Injectable } from "@symph/core";
import { IJoyPlugin } from "./joy-plugin.interface";
import { ConfigurableProvider } from "../joy-server/server/joy-config/configurable-provider.decorator";

export function JoyPlugin(
  options: Partial<ClassProvider & IJoyPlugin> = {}
): ClassDecorator {
  return (target) => {
    // === 注册可被注入的配置项
    ConfigurableProvider(options)(target);

    //=== 注册为provider
    Injectable(options)(target);
  };
}
