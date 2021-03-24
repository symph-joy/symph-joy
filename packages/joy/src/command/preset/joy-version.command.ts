import { CommandProvider } from "../command-provider.decorator";
import { JoyCommand, JoyCommandOptionType } from "../command";
import yargs from "yargs";
import { existsSync } from "fs";
import { join } from "path";
import chalk from "chalk";

@CommandProvider()
export class JoyVersionCommand extends JoyCommand {
  getName(): string {
    return "version";
  }

  options(): { [p: string]: yargs.Options } {
    return {};
  }

  run(args: JoyCommandOptionType<this>): any {
    console.log(`plugins:`); // todo show plugin's version
  }
}
