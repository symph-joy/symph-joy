import { Injectable } from "@symph/core";
import { ServerConfig } from "../next-server/server/server-config";

@Injectable()
export class ServerConfigDev extends ServerConfig {}
