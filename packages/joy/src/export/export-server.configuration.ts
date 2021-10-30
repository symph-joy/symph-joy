import { Configuration } from "@symph/core";
import { JoyServer } from "../joy-server/server/joy-server";

export class ExportServerConfiguration {
  @Configuration.Provider()
  public joyServer: JoyServer;
}
