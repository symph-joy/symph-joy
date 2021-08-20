import { Component } from "@symph/core";
import { ServerApplication } from "@symph/server";
import { pathToRegexp } from "path-to-regexp";
import { IncomingMessage } from "http";
import { JoyReactServer } from "./joy-react-server";
import { JoyApiServer } from "./joy-api-server";

@Component()
export class JoyServer {
  constructor(protected appContext: ServerApplication, public reactServer: JoyReactServer, public apiServer: JoyApiServer) {}

  public async prepare(): Promise<void> {
    const apiUrlPath = pathToRegexp("/api/:path+");
    const apiHandler = this.apiServer.getRequestHandler();
    const reactHandler = this.reactServer.getRequestHandler();
    this.appContext.use((req: IncomingMessage, res: any, next: any) => {
      const url = req.url;
      if (url && apiUrlPath.exec(url)) {
        return apiHandler(req, res, next);
      }
      return reactHandler(req, res);
    });

    await Promise.all([this.apiServer.prepare(), this.reactServer.prepare()]);
  }

  public async close(): Promise<void> {
    await this.reactServer.close();
  }
}
