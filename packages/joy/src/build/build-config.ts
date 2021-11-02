import { Component } from "@symph/core";
import { JoyAppConfig } from "../joy-server/server/joy-app-config";
import { generateBuildId } from "./generate-build-id";
import { nanoid } from "nanoid";

@Component()
export class BuildConfig {
  constructor(private joyAppConfig: JoyAppConfig) {}
  private _buildId: string;

  public async getBuildId(): Promise<string> {
    if (this._buildId) {
      return this._buildId;
    }
    return await generateBuildId(this.joyAppConfig.generateBuildId, nanoid);
  }
}
