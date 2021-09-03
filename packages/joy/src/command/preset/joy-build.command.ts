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

// @Configuration()
// export class JoyReactModuleConfigBuild extends JoyReactConfiguration {
//   @Configuration.Provider()
//   public joyReactRouter: JoyReactRouterPlugin;
// }

@Configuration()
class JoyBuildCommandConfig {
  @Configuration.Provider()
  public joyAppConfig: JoyAppConfig;

  @Configuration.Provider()
  public joyBuildConfiguration: JoyBuildConfiguration;
}

@CommandProvider()
export class JoyBuildCommand extends JoyCommand {
  constructor(@Autowire() protected configService: ConfigService, @Autowire() protected appContext: ServerApplication) {
    super(appContext);
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
    const { _, $0, ...argOpts } = args;
    this.configService.mergeConfig({ dir, dev: false, ...argOpts });
    await this.configService.loadConfig();
    try {
      await this.appContext.loadModule(JoyBuildCommandConfig);
      // await this.appContext.loadModule(JoyServerBuildConfiguration);
      const buildService = await this.appContext.get(JoyBuildService);
      await buildService.build(args.profile, args.debug);
      printAndExit(undefined, 0);
    } catch (err) {
      // console.error(err);
      printAndExit(err, 1);
    }
  }
}
