import { CommandProvider } from "../command-provider.decorator";
import { JoyCommand, JoyCommandOptionType } from "../command";
import { printAndExit } from "../../server/lib/utils";
import { CoreContext, Inject } from "@symph/core";
import { JoyAppConfig } from "../../next-server/server/joy-config/joy-app-config";
import { JoyBuildConfig } from "../../build/joy-build.config";
import { JoyBuildService } from "../../build/joy-build.service";

@CommandProvider()
export class JoyBuildCommand extends JoyCommand {
  constructor(
    private joyAppConfig: JoyAppConfig,
    @Inject() private appContext: CoreContext
  ) {
    super();
  }

  getName(): string {
    return "build";
  }

  options() {
    return {
      help: { alias: "h", boolean: true },
      profile: { boolean: true, default: false },
      debug: { alias: "d", boolean: true, default: true },
    };
  }

  private showHelpAndExit() {
    printAndExit(
      `
      Description
        Compiles the application for production deployment

      Usage
        $ next build <dir>

      <dir> represents the directory of the Next.js application.
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
    this.joyAppConfig.mergeCustomConfig({ dir, dev: true });
    try {
      await this.appContext.loadModule(JoyBuildConfig);
      const buildService = await this.appContext.get(JoyBuildService);
      await buildService.build(args.profile, args.debug);
    } catch (err) {
      console.error(err);
      printAndExit(undefined, 1);
    }
  }
}
