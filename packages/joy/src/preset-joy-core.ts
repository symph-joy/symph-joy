import { Configuration } from "@symph/core";
import { JoyDevCommand } from "./command/preset/joy-dev.command";

@Configuration()
export class PresetJoyCore {
  @Configuration.Provider()
  public joyDevCommand: JoyDevCommand;

  // @Configuration.Provider()
  // public fileGenerator: FileGenerator
}
