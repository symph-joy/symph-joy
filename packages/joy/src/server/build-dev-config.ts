import { Component } from "@symph/core";
import { BuildConfig } from "../build/build-config";

@Component()
export class BuildDevConfig extends BuildConfig {
  public async getBuildId() {
    return "development";
  }
}
