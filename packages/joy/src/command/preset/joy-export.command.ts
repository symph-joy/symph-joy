import { CommandProvider } from "../command-provider.decorator";
import { JoyCommand, JoyCommandOptionType } from "../command";
import { printAndExit } from "../../server/lib/utils";
import { Autowire, Configuration } from "@symph/core";
import { JoyBuildService } from "../../build/joy-build.service";
import { ConfigService } from "@symph/config";
import { ServerApplication } from "@symph/server";
import { JoyAppConfig } from "../../joy-server/server/joy-app-config";
import { JoyBuildConfiguration } from "../../build/joy-build.configuration";
import { JoyReactBuildConfiguration } from "../../react/joy-react-build.configuration";
import { Options } from "yargs";
import { JoyExportAppService } from "../../export/joy-export-app.service";
import path from "path";

// @Configuration()
// export class JoyReactModuleConfigBuild extends JoyReactConfiguration {
//   @Configuration.Provider()
//   public joyReactRouter: JoyReactRouterPlugin;
// }

@Configuration()
class JoyExportCommandConfig {
  @Configuration.Provider()
  public joyAppConfig: JoyAppConfig;

  @Configuration.Provider()
  public joyExportAppService: JoyExportAppService;
}

@CommandProvider()
export class JoyExportCommand extends JoyCommand {
  constructor(@Autowire() protected configService: ConfigService, @Autowire() protected appContext: ServerApplication) {
    super(appContext);
  }

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
    // @ts-ignore
    // process.env.NODE_ENV = "production";
    const dir = args._[0] || ".";
    const { _, $0, silent, outdir, threads } = args;
    let absOutdir = path.resolve(dir, outdir);
    this.configService.mergeConfig({ dir, dev: false });
    await this.configService.loadConfig();
    try {
      await this.appContext.loadModule(JoyExportCommandConfig);
      // await this.appContext.loadModule(JoyServerBuildConfiguration);
      const exportService = await this.appContext.get(JoyExportAppService);
      await exportService.exportApp(dir, { outdir: absOutdir, silent, threads });
      printAndExit(undefined, 0);
    } catch (err) {
      // console.error(err);
      printAndExit(err, 1);
    }
  }
}
