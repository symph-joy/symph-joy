import { Injectable } from "@symph/core";
import { BuildConfig } from "../build/build-config";

@Injectable()
export class BuildDevConfig extends BuildConfig {
  public async getBuildId() {
    return "development";
  }
}
