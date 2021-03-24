import { Configuration } from "@symph/core";
import { JoyDevCommand } from "./command/preset/joy-dev.command";
import { JoyVersionCommand } from "./command/preset/joy-version.command";

@Configuration()
export class PresetJoyCore {
  @Configuration.Provider()
  public joyDevCommand: JoyDevCommand;

  @Configuration.Provider()
  public joyVersionCommand: JoyVersionCommand;
}
