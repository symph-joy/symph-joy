import { Injectable } from "@symph/core";
import { JoyAppConfig } from "../next-server/server/joy-config/joy-app-config";
import { generateBuildId } from "./generate-build-id";
import nanoid from "nanoid/index.js";

@Injectable()
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
