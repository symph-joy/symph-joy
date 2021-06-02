import { __ApiPreviewProps } from "./api-utils";
import { Injectable } from "@symph/core";
import { PrerenderManifest } from "../../build/joy-build.service";
import { join } from "path";
import { PRERENDER_MANIFEST } from "../lib/constants";
import { JoyAppConfig } from "./joy-config/joy-app-config";

@Injectable()
export class ServerConfig {
  constructor(private joyAppConfig: JoyAppConfig) {}

  private _cachedPreviewManifest: PrerenderManifest | undefined;
  public getPrerenderManifest(): PrerenderManifest {
    if (this._cachedPreviewManifest) {
      return this._cachedPreviewManifest;
    }
    const manifest = require(join(
      this.joyAppConfig.distDir,
      PRERENDER_MANIFEST
    ));
    return (this._cachedPreviewManifest = manifest);
  }

  public getPreviewProps(): __ApiPreviewProps {
    return this.getPrerenderManifest().preview!;
  }
}
