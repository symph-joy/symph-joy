import React from "react";
import HotReloader from "./hot-reloader";
import { Component } from "@symph/core";
import { JoyAppConfig } from "../joy-server/server/joy-app-config";
import { ServerApplication } from "@symph/server";
import { JoyApiServer } from "../joy-server/server/joy-api-server";

if (typeof React.Suspense === "undefined") {
  throw new Error(`The version of React you are using is lower than the minimum required version needed for Joy.js. Please upgrade "react" and "react-dom": "npm install react react-dom"`);
}

@Component()
export class JoyApiDevServer extends JoyApiServer {
  constructor(protected serverContext: ServerApplication, protected joyAppConfig: JoyAppConfig, protected hotReloader: HotReloader) {
    super(serverContext, joyAppConfig);
  }

  public async prepare() {
    await this.hotReloader.start();
    const genFilePath = this.joyAppConfig.resolveAutoGenOutDir("./joy/server-providers.config.js");
    await this.hotReloader.ensureModules([genFilePath]);
    // await this.hotReloader.ensureCompilerDone();

    const joyApiModulesPath = this.joyAppConfig.resolveBuildOutDir("joy/server-bundle.js");
    const joyApiModules = require(joyApiModulesPath).default;
    await this.serverContext.loadModule(joyApiModules);
  }
}
