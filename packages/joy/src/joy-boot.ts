import { CommandCenter } from "./command/command-center";
import { JoyStartCommand } from "./command/preset/joy-start.command";
import { JoyBuildCommand } from "./command/preset/joy-build.command";
import { JoyExportCommand } from "./command/preset/joy-export.command";
import { JoyDevCommand } from "./command/preset/joy-dev.command";
import { JoyVersionCommand } from "./command/preset/joy-version.command";

export class JoyBoot {
  public commandCenter = new CommandCenter();

  constructor() {
    this.commandCenter.registerCommand(new JoyStartCommand());
    this.commandCenter.registerCommand(new JoyBuildCommand());
    this.commandCenter.registerCommand(new JoyExportCommand());
    this.commandCenter.registerCommand(new JoyDevCommand());
    this.commandCenter.registerCommand(new JoyVersionCommand());
  }

  public registerCommand(command: Object) {
    this.commandCenter.registerCommand(command);
  }

  public async runCommand(name: string, args: any = {}) {
    return await this.commandCenter.runCommand(name, args);
  }
}
