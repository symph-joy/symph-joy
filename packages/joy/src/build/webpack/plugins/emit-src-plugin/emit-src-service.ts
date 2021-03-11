import { Injectable } from "@symph/core";
import { IWebpackEmitModule } from "./emit-src-plugin";
import path from "path";
import { existsSync } from "fs";
import { JoyAppConfig } from "../../../../next-server/server/joy-config/joy-app-config";
import { fileExists } from "../../../../lib/file-exists";

type TEmitManifest = Record<string, IWebpackEmitModule>;

@Injectable()
export class EmitSrcService {
  private manifest?: TEmitManifest;

  constructor(private joyConfig: JoyAppConfig) {}

  public updateEmitManifest(): void {
    this.manifest = this.readCurrentEmitManifest();
  }

  public getEmitManifest(): TEmitManifest | undefined {
    if (!this.manifest) {
      return (this.manifest = this.readCurrentEmitManifest());
    }
    return this.manifest;
  }

  public getEmitInfo(distFilePath: string): IWebpackEmitModule | undefined {
    if (!this.manifest) {
      return undefined;
    }
    return this.manifest[distFilePath];
  }

  private readCurrentEmitManifest(): TEmitManifest | undefined {
    const emitManifestPath = this.joyConfig.resolveAppDir(
      this.joyConfig.distDir,
      "./dist/emit-manifest.json"
    );
    if (!fileExists(emitManifestPath, "file")) {
      return;
    }
    let emitManifest: Record<string, IWebpackEmitModule> | undefined;
    if (existsSync(emitManifestPath)) {
      emitManifest = require(emitManifestPath);
    }
    return emitManifest;
  }
}
