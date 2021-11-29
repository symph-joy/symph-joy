import { CommandProvider } from "../command-provider.decorator";
import { JoyCommand, JoyCommandOptionType } from "../command";
import * as Log from "../../build/output/log";
import { startedDevelopmentServer } from "../../build/output";
import { printAndExit } from "../../server/lib/utils";
import { JoyAppConfig } from "../../joy-server/server/joy-app-config";
import { JoyDevConfiguration } from "../../server/joy-dev.configuration";
import { JoyServerApplicationDev } from "../../server/joy-server-application-dev";
import { JoyServerFactoryDev } from "../../server/joy-server-factory-dev";
import { ApplicationContext, ValueProvider } from "@symph/core";
import HotReloader from "../../server/hot-reloader";
import { BuildDevConfiguration } from "../../build/build-dev.configuration";

import hmrEventEmitter from "../../server/dev/emitter";
import { SYMPH_CONFIG_INIT_VALUE } from "@symph/config";
import { debounce } from "lodash";

@CommandProvider()
export class JoyDevCommand extends JoyCommand {
  private dir: string;
  private argOpts: any;

  private joyDevConfiguration: { new (...args: any): JoyDevConfiguration };
  private joyServerApplicationDev: JoyServerApplicationDev;
  private serverDevError: Error | undefined;
  private isReloading = false;
  private isInvalidate = false;

  private buildContext: ApplicationContext;
  private hotReloader: HotReloader;

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

    const [sassVersion, nodeSassVersion] = await Promise.all([
      getPackageVersion({ cwd: dir, name: "sass" }),
      getPackageVersion({ cwd: dir, name: "node-sass" }),
    ]);
    if (sassVersion && nodeSassVersion) {
      Log.warn(
        "Your project has both `sass` and `node-sass` installed as dependencies, but should only use one or the other. " +
          "Please remove the `node-sass` dependency from your project. " +
          " #duplicate-sass"
      );
    }
  }

  async startDevServer(): Promise<void> {
    this.isReloading = true;
    if (this.joyServerApplicationDev) {
      await this.joyServerApplicationDev.close();
    }
    const appContext = await JoyServerFactoryDev.createServer(
      {},
      this.joyDevConfiguration,
      { dir: this.dir, dev: true, ...this.argOpts },
      this.buildContext
    );
    this.joyServerApplicationDev = appContext;
    appContext.setDevError(this.serverDevError);

    const config = await appContext.get(JoyAppConfig);
    if (config === undefined) {
      throw new Error("Start server error, can not find joy config provider");
    }
    const { hostname, port } = config;
    await appContext.prepare();
    try {
      await appContext.listenAsync(port, hostname);
    } catch (err) {
      if (err.code === "EADDRINUSE") {
        let errorMessage = `Port ${port} is already in use.`;
        const pkgAppPath = require("find-up").sync("package.json", {
          cwd: this.dir,
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
        this.isReloading = false;
        return this.reloadServer(err);
        // throw err;
      }
    }
    this.isReloading = false;
    if (this.isInvalidate) {
      this.isInvalidate = false;
      await this.reloadServer();
    }
    const appUrl = `http://${hostname}:${port}`;
    startedDevelopmentServer(appUrl);
  }

  private reloadServer = debounce(
    async (devError?: Error) => {
      if (this.isReloading) {
        this.isInvalidate = true;
        return;
      }
      try {
        if (devError) {
          Log.info(`Reload server with error:(${devError})`);
        } else {
          Log.info(`Reload server`);
        }
        this.serverDevError = devError;
        await this.startDevServer();
      } catch (err) {
        console.error(err);
        printAndExit(undefined, 1);
      }
    },
    600,
    { leading: false, trailing: true }
  );

  async run(args: JoyCommandOptionType<this>): Promise<any> {
    // @ts-ignore
    process.env.NODE_ENV = "development";
    // @ts-ignore
    // process.env.__JOY_TEST_WITH_DEVTOOL = true;

    const dir = args._[0] || ".";
    const { _, $0, ...argOpts } = args;
    this.preflight().catch(() => {});

    this.dir = dir;
    this.argOpts = argOpts;

    this.buildContext = new ApplicationContext([
      // JoyServerConfiguration,
      BuildDevConfiguration,
      {
        configInitValue: {
          name: SYMPH_CONFIG_INIT_VALUE,
          useValue: {
            dir: dir,
            dev: true,
            ...argOpts,
          },
        } as ValueProvider,
      },
    ]);
    await this.buildContext.init();
    const hotReloader = await this.buildContext.get(HotReloader);
    this.hotReloader = hotReloader;

    this.joyDevConfiguration = JoyDevConfiguration;
    hmrEventEmitter.on("EVENT_COMPONENT_CHANGE", async (updatedModules: string[]) => {
      if (!updatedModules?.length) {
        return;
      }
      let isComponentsChanged = false;
      for (let i = updatedModules.length - 1; i >= 0; i--) {
        if (updatedModules[i].indexOf("/joy/server-providers.config.js")) {
          isComponentsChanged = true;
          break;
        }
      }
      if (!isComponentsChanged) {
        return;
      }
      await this.reloadServer();
    });

    try {
      await this.startDevServer();
    } catch (err) {
      console.error(err);
      printAndExit(undefined, 1);
    }
  }
}
