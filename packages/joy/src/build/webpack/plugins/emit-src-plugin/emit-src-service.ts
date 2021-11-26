import { Component, IComponentLifecycle } from "@symph/core";
import path from "path";
import { existsSync } from "fs";
import { JoyAppConfig } from "../../../../joy-server/server/joy-app-config";
import { fileExists } from "../../../../lib/file-exists";

export interface IEmitBuildModule {
  resource: string;
  dest: string;
  hash: string;
}

type TEmitBuildManifest = Record<string, IEmitBuildModule>;

@Component()
export class EmitSrcService implements IComponentLifecycle {
  private manifest: TEmitBuildManifest;

  constructor(private joyConfig: JoyAppConfig) {}

  async initialize(): Promise<void> {
    this.updateEmitManifest();
  }

  public updateEmitManifest(): void {
    this.manifest = this.readCurrentEmitManifest() || {};
  }

  public getEmitManifest(): TEmitBuildManifest | undefined {
    if (!this.manifest) {
      this.updateEmitManifest();
    }
    return this.manifest;
  }

  public getBuildModule(destAbsPath: string): IEmitBuildModule | undefined {
    if (!this.manifest) {
      return undefined;
    }
    return this.manifest[destAbsPath];
  }

  public getBuildModuleBySrc(srcAbsPath: string): IEmitBuildModule | undefined {
    if (!this.manifest) {
      return undefined;
    }
    for (const key of Object.keys(this.manifest)) {
      if (this.manifest[key].resource === srcAbsPath) {
        return this.manifest[key];
      }
    }
    return undefined;
  }

  private readCurrentEmitManifest(): TEmitBuildManifest | undefined {
    const emitManifestPath = this.joyConfig.resolveAppDir(this.joyConfig.distDir, "./dist/emit-manifest.json");
    if (!fileExists(emitManifestPath, "file")) {
      return;
    }
    let emitManifest: Record<string, IEmitBuildModule> | undefined;
    if (existsSync(emitManifestPath)) {
      emitManifest = require(emitManifestPath);
    }
    return emitManifest;
  }
}
