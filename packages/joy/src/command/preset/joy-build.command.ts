import { CommandProvider } from "../command-provider.decorator";
import { JoyCommand, JoyCommandOptionType } from "../command";
import { printAndExit } from "../../server/lib/utils";
import { Configuration, CoreContext, Inject } from "@symph/core";
import { JoyAppConfig } from "../../joy-server/server/joy-config/joy-app-config";
import { JoyBuildConfig } from "../../build/joy-build.config";
import { JoyBuildService } from "../../build/joy-build.service";
import { JoyReactModuleConfig } from "../../react/joy-react-module.config";
import { JoyReactRouterPlugin } from "../../react/router/joy-react-router-plugin";

@Configuration()
export class JoyReactModuleConfigBuild extends JoyReactModuleConfig {
  @Configuration.Provider()
  public joyReactRouter: JoyReactRouterPlugin;
}

@Configuration({
  imports: {
    joyReactConfig: JoyReactModuleConfigBuild,
    joyBuildConfig: JoyBuildConfig,
  },
})
class JoyBuildCommandConfig {}

@CommandProvider()
export class JoyBuildCommand extends JoyCommand {
  constructor(private joyAppConfig: JoyAppConfig, @Inject() private appContext: CoreContext) {
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
    this.joyAppConfig.mergeCustomConfig({ dir, dev: true });
    try {
      await this.appContext.loadModule(JoyBuildCommandConfig);
      const buildService = await this.appContext.get(JoyBuildService);
      await buildService.build(args.profile, args.debug);
      printAndExit(undefined, 0);
    } catch (err) {
      // console.error(err);
      printAndExit(err, 1);
    }
  }
}
