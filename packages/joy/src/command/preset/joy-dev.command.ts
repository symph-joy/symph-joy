import { CommandProvider } from "../command-provider.decorator";
// import yargs = require('yargs');
// import yargs from "yargs";
import { JoyCommand, JoyCommandOptionType } from "../command";
import * as Log from "../../build/output/log";
import { startedDevelopmentServer } from "../../build/output";
import { printAndExit } from "../../server/lib/utils";
import { Configuration, CoreContext, Inject } from "@symph/core";
import { NextDevServer } from "../../server/next-dev-server";
import http from "http";
import { JoyAppConfig } from "../../next-server/server/joy-config/joy-app-config";
import { ServerConfigDev } from "../../server/server-config-dev";
import { JoyBuildConfig } from "../../build/joy-build.config";
import { ReactContextFactoryDev } from "../../server/react-context-factory-dev";
import HotReloader from "../../server/hot-reloader";
import { JoyReactRouterPluginDev } from "../../router/joy-react-router-plugin-dev";
import { JoyGenModuleServerProvider } from "../../plugin/joy-gen-module-server.provider";
import { JoyServerConfig } from "./joy-start.command";

@Configuration()
class JoyBuildConfigDev extends JoyBuildConfig {
  @Configuration.Provider()
  public joyReactRouter: JoyReactRouterPluginDev;
}

@Configuration({ imports: [JoyBuildConfigDev] })
export class JoyDevServerConfig extends JoyServerConfig {
  @Configuration.Provider()
  public serverConfig: ServerConfigDev;

  @Configuration.Provider()
  public reactContextFactory: ReactContextFactoryDev;

  @Configuration.Provider()
  public hotReloader: HotReloader;

  @Configuration.Provider()
  public joyServer: NextDevServer;
}

@CommandProvider()
export class JoyDevCommand extends JoyCommand {
  private dir: string;

  constructor(
    private joyAppConfig: JoyAppConfig,
    @Inject() private appContext: CoreContext
  ) {
    super();
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
    if (
      reactVersion &&
      semver.lt(reactVersion, "16.10.0") &&
      semver.coerce(reactVersion)?.version !== "0.0.0"
    ) {
      Log.warn(
        "Fast Refresh is disabled in your application due to an outdated `react` version. Please upgrade 16.10 or newer!" +
          " Read more: https://err.sh/next.js/react-version"
      );
    } else {
      const reactDomVersion: string | null = await getPackageVersion({
        cwd: dir,
        name: "react-dom",
      });
      if (
        reactDomVersion &&
        semver.lt(reactDomVersion, "16.10.0") &&
        semver.coerce(reactDomVersion)?.version !== "0.0.0"
      ) {
        Log.warn(
          "Fast Refresh is disabled in your application due to an outdated `react-dom` version. Please upgrade 16.10 or newer!" +
            " Read more: https://err.sh/next.js/react-version"
        );
      }
    }

    const [sassVersion, nodeSassVersion] = await Promise.all([
      getPackageVersion({ cwd: dir, name: "sass" }),
      getPackageVersion({ cwd: dir, name: "node-sass" }),
    ]);
    if (sassVersion && nodeSassVersion) {
      Log.warn(
        "Your project has both `sass` and `node-sass` installed as dependencies, but should only use one or the other. " +
          "Please remove the `node-sass` dependency from your project. " +
          " Read more: https://err.sh/next.js/duplicate-sass"
      );
    }
  }

  // async startDevServer( appContext: CoreContext, {dir, hostname, port, dev, isNextDevCommand}: {dir: string, hostname: string, port: number, dev: boolean, isNextDevCommand: boolean}): Promise<NextDevServer> {

  async startDevServer(appContext: CoreContext): Promise<NextDevServer> {
    await appContext.loadModule(JoyDevServerConfig);
    const config = this.joyAppConfig;
    if (config === undefined) {
      throw new Error("Start server error, can not find joy config provider");
    }
    const { dir, hostname, port } = config;
    const server = await appContext.get(NextDevServer);
    if (server === undefined) {
      throw new Error("Start server error, can not find joy server provider");
    }

    const srv = http.createServer(server.getRequestHandler());
    await new Promise<void>((resolve, reject) => {
      // This code catches EADDRINUSE error if the port is already in use
      srv.on("error", reject);
      srv.on("listening", () => resolve());
      srv.listen(port, hostname);
    }).catch((err) => {
      if (err.code === "EADDRINUSE") {
        let errorMessage = `Port ${port} is already in use.`;
        const pkgAppPath = require("find-up").sync("package.json", {
          cwd: dir,
        });
        const appPackage = require(pkgAppPath);
        if (appPackage.scripts) {
          const nextScript = Object.entries(appPackage.scripts).find(
            (scriptLine) => scriptLine[1] === "next"
          );
          if (nextScript) {
            errorMessage += `\nUse \`npm run ${nextScript[0]} -- -p <some other port>\`.`;
          }
        }
        throw new Error(errorMessage);
      } else {
        throw err;
      }
    });

    // todo 重新设计，当应用关闭时，也要关闭http模块，否则jest测试item无法结束。
    // @ts-ignore
    server.closeSrv = async () => {
      await server.close();
      return new Promise<void>((resolve, reject) => {
        srv.close((err) => {
          err ? reject(err) : resolve();
        });
      });
    };
    // It's up to caller to run `app.prepare()`, so it can notify that the server
    // is listening before starting any intensive operations.

    return server;
  }

  async run(args: JoyCommandOptionType<this>): Promise<any> {
    // @ts-ignore
    process.env.NODE_ENV = "development";
    // @ts-ignore
    process.env.__NEXT_TEST_WITH_DEVTOOL = true;

    const dir = args._[0] || ".";
    const { port, hostname } = args;
    const appUrl = `http://${hostname}:${port}`;
    this.joyAppConfig.mergeCustomConfig({ dir, hostname, port, dev: true });
    this.preflight().catch(() => {});
    try {
      const server = await this.startDevServer(this.appContext);
      startedDevelopmentServer(appUrl);
      await server.prepare();
    } catch (err) {
      console.error(err);
      printAndExit(undefined, 1);
    }
  }

  // async _run(args: JoyCommandOptionType<this>): Promise<any> {
  //   const dir = args._[0] || '.'
  //   const {port, hostname} = args
  //   const appUrl = `http://${hostname}:${port}`
  //   this.joyAppConfig.mergeCustomConfig({dir, hostname, port, dev: true})
  //
  //   return startServer(
  //     this.joyAppConfig,
  //     port,
  //     hostname
  //   )
  //     .then(async (app) => {
  //       startedDevelopmentServer(appUrl)
  //       // Start preflight after server is listening and ignore errors:
  //       this.preflight().catch(() => {
  //       })
  //       // Finalize server bootup:
  //       await app.prepare()
  //       return app
  //     })
  //     .catch((err) => {
  //       if (err.code === 'EADDRINUSE') {
  //         let errorMessage = `Port ${port} is already in use.`
  //         const pkgAppPath = require('find-up').sync(
  //           'package.json',
  //           {
  //             cwd: dir,
  //           }
  //         )
  //         const appPackage = require(pkgAppPath)
  //         if (appPackage.scripts) {
  //           const nextScript = Object.entries(appPackage.scripts).find(
  //             (scriptLine) => scriptLine[1] === 'next'
  //           )
  //           if (nextScript) {
  //             errorMessage += `\nUse \`npm run ${nextScript[0]} -- -p <some other port>\`.`
  //           }
  //         }
  //         console.error(errorMessage)
  //       } else {
  //         console.error(err)
  //       }
  //       process.nextTick(() => printAndExit('', 1))
  //     })
  //
  // }
}
