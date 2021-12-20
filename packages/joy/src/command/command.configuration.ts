import { Configuration } from "@symph/core";
import { JoyDevCommand } from "./preset/joy-dev.command";
import { JoyVersionCommand } from "./preset/joy-version.command";
import { JoyStartCommand } from "./preset/joy-start.command";
import { JoyBuildCommand } from "./preset/joy-build.command";
import { CommandCenter } from "./command-center";
import { JoyExportCommand } from "./preset/joy-export.command";

@Configuration()
export class CommandConfiguration {
  @Configuration.Component()
  public commandCenter: CommandCenter;

  // ====== preset commands
  @Configuration.Component()
  public joyDevCommand: JoyDevCommand;

  @Configuration.Component()
  public joyVersionCommand: JoyVersionCommand;

  @Configuration.Component()
  public JoyBuildCommand: JoyBuildCommand;

  @Configuration.Component()
  public joyStartCommand: JoyStartCommand;

  @Configuration.Component()
  public joyExportCommand: JoyExportCommand;
}
