import { CommandProvider } from "../command-provider.decorator";
// import yargs = require('yargs');
// import yargs from "yargs";
import { JoyCommand, JoyCommandOptionType } from "../command";
import * as Log from "../../build/output/log";
import { startedDevelopmentServer } from "../../build/output";
import { printAndExit } from "../../server/lib/utils";
import { Configuration, Autowire } from "@symph/core";
import { JoyReactDevServer } from "../../server/joy-react-dev-server";
import { JoyAppConfig } from "../../joy-server/server/joy-app-config";
import { ServerConfigDev } from "../../server/server-config-dev";
import { JoyBuildConfiguration } from "../../build/joy-build.configuration";
import { ReactContextFactoryDev } from "../../server/react-context-factory-dev";
import HotReloader from "../../server/hot-reloader";
import { JoyReactRouterPluginDev } from "../../react/router/joy-react-router-plugin-dev";
// import { JoyServerConfig } from "./joy-start.command";
import { ServerApplication } from "@symph/server";
import { JoyReactConfiguration } from "../../react/joy-react.configuration";
import { JoyApiDevServer } from "../../server/joy-api-dev-server";
import { JoyDevServer } from "../../server/joy-dev-server";
import { ConfigService } from "@symph/config";
import { JoyServerConfiguration } from "../../joy-server/server/joy-server.configuration";
import { JoyServerDevConfiguration } from "../../server/joy-server-dev.configuration";

// @Configuration()
// export class JoyReactModuleConfigDev extends JoyReactConfiguration {
//   @Configuration.Provider()
//   public joyReactRouter: JoyReactRouterPluginDev;
//
//   @Configuration.Provider()
//   public reactContextFactory: ReactContextFactoryDev;
// }

// @Configuration({
//   imports: {
//     joyReactConfig: JoyReactModuleConfigDev,
//     joyBuildConfig: JoyBuildConfig,
//   },
// })
// export class JoyDevServerConfig extends JoyServerConfiguration {
//   @Configuration.Provider()
//   public serverConfig: ServerConfigDev;
//
//   @Configuration.Provider()
//   public hotReloader: HotReloader;
//
//   @Configuration.Provider()
//   public joyApiServer: JoyApiDevServer;
//
//   @Configuration.Provider()
//   public joyReactServer: JoyReactDevServer;
//
//   @Configuration.Provider()
//   public joyServer: JoyDevServer;
// }

@CommandProvider()
export class JoyDevCommand extends JoyCommand {
  private dir: string;

  constructor(@Autowire() protected configService: ConfigService, @Autowire() protected appContext: ServerApplication) {
    super(appContext);
  }

  getName(): string {
    return "dev";
  }

  options() {
    return {
      port: { type: "number" as const, default: 3000 },
      hostname: { type: "string" as const, default: "localhost" },
    };
  }

  async preflight() {
    const dir = this.dir;
    const { getPackageVersion } = await import("../../lib/get-package-version");
    const semver = await import("semver").then((res) => res.default);

    const reactVersion: string | null = await getPackageVersion({
      cwd: dir,
      name: "react",
    });
    if (reactVersion && semver.lt(reactVersion, "16.10.0") && semver.coerce(reactVersion)?.version !== "0.0.0") {
      Log.warn("Fast Refresh is disabled in your application due to an outdated `react` version. Please upgrade 16.10 or newer!");
    } else {
      const reactDomVersion: string | null = await getPackageVersion({
        cwd: dir,
        name: "react-dom",
      });
      if (reactDomVersion && semver.lt(reactDomVersion, "16.10.0") && semver.coerce(reactDomVersion)?.version !== "0.0.0") {
        Log.warn("Fast Refresh is disabled in your application due to an outdated `react-dom` version. Please upgrade 16.10 or newer!");
      }
    }

    const [sassVersion, nodeSassVersion] = await Promise.all([getPackageVersion({ cwd: dir, name: "sass" }), getPackageVersion({ cwd: dir, name: "node-sass" })]);
    if (sassVersion && nodeSassVersion) {
      Log.warn("Your project has both `sass` and `node-sass` installed as dependencies, but should only use one or the other. " + "Please remove the `node-sass` dependency from your project. " + " #duplicate-sass");
    }
  }

  // async startDevServer( appContext: CoreContext, {dir, hostname, port, dev, isJoyDevCommand}: {dir: string, hostname: string, port: number, dev: boolean, isJoyDevCommand: boolean}): Promise<JoyReactDevServer> {

  async startDevServer(appContext: ServerApplication): Promise<JoyDevServer> {
    await appContext.loadModule([JoyServerDevConfiguration]);
    const config = await appContext.get(JoyAppConfig);
    if (config === undefined) {
      throw new Error("Start server error, can not find joy config provider");
    }
    const { dir, hostname, port } = config;
    const server = await appContext.get(JoyDevServer);
    // const apiServer = await appContext.get(JoyApiDevServer);
    if (server === undefined) {
      throw new Error("Start server error, can not find joy server provider");
    }
    await server.prepare();

    try {
      await appContext.listenAsync(port, hostname);
    } catch (err) {
      if (err.code === "EADDRINUSE") {
        let errorMessage = `Port ${port} is already in use.`;
        const pkgAppPath = require("find-up").sync("package.json", {
          cwd: dir,
        });
        const appPackage = require(pkgAppPath);
        if (appPackage.scripts) {
          const joyScript = Object.entries(appPackage.scripts).find((scriptLine) => scriptLine[1] === "joy");
          if (joyScript) {
            errorMessage += `\nUse \`npm run ${joyScript[0]} -- -p <some other port>\`.`;
          }
        }
        throw new Error(errorMessage);
      } else {
        throw err;
      }
    }

    // todo 重新设计，当应用关闭时，也要关闭http模块，否则jest测试item无法结束。
    // @ts-ignore
    server.closeSrv = async () => {
      await server.close();
      await appContext.close();
    };
    // It's up to caller to run `app.prepare()`, so it can notify that the server
    // is listening before starting any intensive operations.

    return server;
  }

  async run(args: JoyCommandOptionType<this>): Promise<any> {
    // @ts-ignore
    process.env.NODE_ENV = "development";
    // @ts-ignore
    process.env.__JOY_TEST_WITH_DEVTOOL = true;

    const dir = args._[0] || ".";
    const { port, hostname } = args;
    const appUrl = `http://${hostname}:${port}`;
    const { _, $0, ...argOpts } = args;
    this.configService.mergeConfig({ dir, dev: true, ...argOpts });
    await this.configService.loadConfig();
    this.preflight().catch(() => {});
    try {
      await this.startDevServer(this.appContext);
      startedDevelopmentServer(appUrl);
    } catch (err) {
      console.error(err);
      printAndExit(undefined, 1);
    }
  }
}
