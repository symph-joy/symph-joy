import { IConfigLoader } from "./config-loader.interface";
import { Component } from "@symph/core";

@Component()
export class ConfigLoaderFactory {
  public getLoaders(configs: Record<string, any>): IConfigLoader[] {
    return [];
  }
}
