import { Configuration } from "@symph/core";
import { JoyApiServer } from "../joy-server/server/joy-api-server";
import { JoyServer } from "../joy-server/server/joy-server";

export class ExportServerConfiguration {
  @Configuration.Provider()
  public joyApiServer: JoyApiServer;

  @Configuration.Provider()
  public joyServer: JoyServer;
}
