import { Configuration } from "@symph/core";
import { JoyVersionCommand } from "./joy-version.command";
import { JoyDevCommand } from "./joy-dev.command";
import { JoyBuildCommand } from "./joy-build.command";
import { JoyStartCommand } from "./joy-start.command";

@Configuration()
export class JoyPresetCommandsConfig {
  @Configuration.Provider()
  public joyDevCommand: JoyDevCommand;

  @Configuration.Provider()
  public joyVersionCommand: JoyVersionCommand;

  @Configuration.Provider()
  public JoyBuildCommand: JoyBuildCommand;

  @Configuration.Provider()
  public joyStartCommand: JoyStartCommand;
}
