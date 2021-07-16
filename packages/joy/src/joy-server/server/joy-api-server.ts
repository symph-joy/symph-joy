import React from "react";
import { Injectable } from "@symph/core";
import { ServerApplication } from "@symph/server";
import { JoyAppConfig } from "./joy-config/joy-app-config";

if (typeof React.Suspense === "undefined") {
  throw new Error(
    `The version of React you are using is lower than the minimum required version needed for Joy.js. Please upgrade "react" and "react-dom": "npm install react react-dom"`
  );
}

@Injectable()
export class JoyApiServer {
  constructor(
    protected serverContext: ServerApplication,
    protected joyAppConfig: JoyAppConfig
  ) {}

  public async prepare(): Promise<void> {
    const joyApiModulesPath = this.joyAppConfig.resolveBuildOutDir(
      "joy/joy-bundle.js"
    );
    const joyApiModules = require(joyApiModulesPath).default;
    await this.serverContext.loadModule(joyApiModules);
  }
}
