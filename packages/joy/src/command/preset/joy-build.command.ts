import {CommandProvider} from "../command-provider.decorator";
import {JoyCommand, JoyCommandOptionType} from "../command";
import {printAndExit} from "../../server/lib/utils";
import {JoyBuildService} from "../../build/joy-build.service";
import {JoyBuildConfiguration} from "../../server/joy-build.configuration";
import {JoyServerFactory} from "../../joy-server/server/joy-server-factory";

@CommandProvider()
export class JoyBuildCommand extends JoyCommand {
  // constructor(@Autowire() protected configService: ConfigService, @Autowire() protected appContext: ServerApplication) {
  //   super();
  // }

  getName(): string {
    return "build";
  }

  options() {
    return {
      help: {alias: "h", boolean: true},
      profile: {boolean: true, default: false},
      debug: {alias: "d", boolean: true, default: true},
    };
  }

  private showHelpAndExit() {
    printAndExit(
      `
      Description
        Compiles the application for production deployment

      Usage
        $ joy build <dir>

      <dir> represents the directory of the Joy.js application.
      If no directory is provided, the current directory will be used.

      Options
      --profile     Can be used to enable React Production Profiling
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
    const {_, $0, ...argOpts} = args;
    // this.configService.mergeConfig({ dir, dev: false, ...argOpts });

    const appContext = await JoyServerFactory.createServer({}, JoyBuildConfiguration, {dir, dev: false, ...argOpts});

    // await this.configService.loadConfig();
    try {
      // await (this.appContext as JoyBoot).initServer(JoyBuildConfiguration);
      const buildService = await appContext.get(JoyBuildService);
      await buildService.build(args.profile, args.debug);
      printAndExit(undefined, 0);
    } catch (err) {
      // console.error(err);
      printAndExit(err, 1);
    }
  }
}
