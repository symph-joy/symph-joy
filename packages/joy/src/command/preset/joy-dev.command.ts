import { CommandProvider } from "../command-provider.decorator";
import { JoyCommand, JoyCommandOptionType } from "../command";
import * as Log from "../../build/output/log";
import { startedDevelopmentServer } from "../../build/output";
import { printAndExit } from "../../server/lib/utils";
import { JoyAppConfig } from "../../joy-server/server/joy-app-config";
import { ServerApplication, ServerFactory } from "@symph/server";
import { JoyDevServer } from "../../server/joy-dev-server";
import { JoyDevConfiguration } from "../../server/joy-dev.configuration";

@CommandProvider()
export class JoyDevCommand extends JoyCommand {
  private dir: string;

  // constructor(@Autowire() protected configService: ConfigService, @Autowire() protected appContext: ServerApplication) {
  //   super();
  // }

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
    const config = await appContext.get(JoyAppConfig);
    if (config === undefined) {
      throw new Error("Start server error, can not find joy config provider");
    }
    const { dir, hostname, port } = config;
    const server = await appContext.get(JoyDevServer);
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

    const appContext = await ServerFactory.createServer({}, JoyDevConfiguration, { dir, dev: true, ...argOpts });

    this.preflight().catch(() => {});
    try {
      await this.startDevServer(appContext);
      startedDevelopmentServer(appUrl);
    } catch (err) {
      console.error(err);
      printAndExit(undefined, 1);
    }
  }
}
