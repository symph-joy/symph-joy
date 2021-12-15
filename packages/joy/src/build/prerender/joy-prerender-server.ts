import { Component } from "@symph/core";
import { JoyAppConfig } from "../../joy-server/server/joy-app-config";
import { JoyServerApplication } from "../../joy-server/server/joy-server-application";
import getPort from "get-port";

@Component()
export class JoyPrerenderServer {
  constructor(private readonly joyServerApplication: JoyServerApplication, private readonly joyAppConfig: JoyAppConfig) {}

  public async startPrerenderServer() {
    const port = this.joyAppConfig.port;
    await this.joyServerApplication.prepare();
    try {
      await this.joyServerApplication.listenAsync(port, "127.0.0.1");
    } catch (err) {
      if (err.code === "EADDRINUSE") {
        let errorMessage = `Start export server failed, Port ${port} is already in use.`;
        throw new Error(errorMessage);
      } else {
        throw err;
      }
    }
  }

  public async closePrerenderServer() {
    await this.joyServerApplication.httpAdapter.close();
  }
}
