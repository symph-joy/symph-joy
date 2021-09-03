import React from "react";
import { Component } from "@symph/core";
import { ServerApplication } from "@symph/server";
import { JoyAppConfig } from "./joy-app-config";
import { IncomingMessage, ServerResponse } from "http";
import { UrlWithParsedQuery } from "url";

if (typeof React.Suspense === "undefined") {
  throw new Error(`The version of React you are using is lower than the minimum required version needed for Joy.js. Please upgrade "react" and "react-dom": "npm install react react-dom"`);
}

@Component()
export class JoyApiServer {
  constructor(protected serverContext: ServerApplication, protected joyAppConfig: JoyAppConfig) {}

  public async prepare(): Promise<void> {
    const joyApiModulesPath = this.joyAppConfig.resolveBuildOutDir("joy/server-bundle.js");
    const joyApiModules = require(joyApiModulesPath).default;
    await this.serverContext.loadModule(joyApiModules);
  }

  getRequestHandler() {
    return this.handleRequest.bind(this);
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse, next: () => unknown): Promise<unknown> {
    // 由ServerContext处理请求。
    return next();
  }

  public async close() {}
}
