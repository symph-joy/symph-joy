import { JoyAppConfig } from "../joy-server/server/joy-config/joy-app-config";
import { JsonSchema } from "@tsed/schema";

export interface IJoyPlugin {
  name: string;
  version: string;
  onConfigChanged?: (
    config: JoyAppConfig,
    changedKey: string[]
  ) => JoyAppConfig;
}
