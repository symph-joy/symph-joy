import { ConfigLoader } from "./config-loader";
import { Component } from "@symph/core";

@Component()
export class ConfigLoaderFactory {
  public getLoaders(configs: Record<string, any>): ConfigLoader[] {
    return [];
  }
}
