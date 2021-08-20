import { Component } from "@symph/core";
import { ServerApplication } from "@symph/server";
import { JoyReactDevServer } from "./joy-react-dev-server";
import { JoyApiDevServer } from "./joy-api-dev-server";
import { JoyServer } from "../joy-server/server/joy-server";

@Component()
export class JoyDevServer extends JoyServer {
  constructor(protected appContext: ServerApplication, public reactServer: JoyReactDevServer, public apiServer: JoyApiDevServer) {
    super(appContext, reactServer, apiServer);
  }
}
