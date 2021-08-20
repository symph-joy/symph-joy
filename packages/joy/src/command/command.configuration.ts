import { Configuration } from "@symph/core";
import { JoyDevCommand } from "./preset/joy-dev.command";
import { JoyVersionCommand } from "./preset/joy-version.command";
import { JoyStartCommand } from "./preset/joy-start.command";
import { JoyBuildCommand } from "./preset/joy-build.command";
import { CommandCenter } from "./command-center";

@Configuration()
export class CommandConfiguration {
  @Configuration.Provider()
  public commandCenter: CommandCenter;

  // ====== preset commands
  @Configuration.Provider()
  public joyDevCommand: JoyDevCommand;

  @Configuration.Provider()
  public joyVersionCommand: JoyVersionCommand;

  @Configuration.Provider()
  public JoyBuildCommand: JoyBuildCommand;

  @Configuration.Provider()
  public joyStartCommand: JoyStartCommand;
}
