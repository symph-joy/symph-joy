import { CommandProvider } from "../command-provider.decorator";
import { JoyCommand, JoyCommandOptionType } from "../command";
import { printAndExit } from "../../server/lib/utils";
import { Configuration } from "@symph/core";
import { ServerFactory } from "@symph/server";
import { JoyAppConfig } from "../../joy-server/server/joy-app-config";
import { JoyExportAppService } from "../../export/joy-export-app.service";
import path from "path";
import { JoyExportConfiguration } from "../../server/joy-export.configuration";

@Configuration()
class JoyExportCommandConfig {
  @Configuration.Provider()
  public joyAppConfig: JoyAppConfig;

  @Configuration.Provider()
  public joyExportAppService: JoyExportAppService;
}

@CommandProvider()
export class JoyExportCommand extends JoyCommand {
  getName(): string {
    return "export";
  }

  options() {
    return {
      help: { alias: "h", boolean: true },
      silent: { alias: "s", boolean: true, default: false },
      outdir: { alias: "o", string: true, default: "out" },
      threads: { count: true, default: undefined },
    };
  }

  private showHelpAndExit() {
    printAndExit(
      `
      Description
        Exports the application for production deployment

      Usage
        $ next export [options] <dir>

      <dir> represents the directory of the Next.js application.
      If no directory is provided, the current directory will be used.

      Options
        -h - list this help
        -o - set the output dir (defaults to 'out')
        -s - do not print any messages to console
    `,
      0
    );
  }

  async run(args: JoyCommandOptionType<this>): Promise<any> {
    if (args.help) {
      this.showHelpAndExit();
      return;
    }
    const dir = args._[0] || ".";
    const { _, $0, silent, outdir, threads } = args;
    let absOutdir = path.resolve(dir, outdir);

    const appContext = await ServerFactory.createServer({}, JoyExportConfiguration, { dir, dev: false });
    try {
      const exportService = await appContext.get(JoyExportAppService);
      await exportService.exportApp(dir, { outdir: absOutdir, silent, threads });
      printAndExit(undefined, 0);
    } catch (err) {
      printAndExit(err, 1);
    }
  }
}
