import { CommandProvider } from "../command-provider.decorator";
// import yargs = require('yargs');
// import yargs from "yargs";
import { JoyCommand, JoyCommandOptionType } from "../command";
import { printAndExit } from "../../server/lib/utils";
import { Configuration, CoreContext, Autowire } from "@symph/core";
import http from "http";
import { JoyAppConfig } from "../../joy-server/server/joy-app-config";
import { JoyReactServer } from "../../joy-server/server/joy-react-server";
import { ServerConfig } from "../../joy-server/server/server-config";
import { JoyReactConfiguration } from "../../react/joy-react.configuration";
import { JoyApiDevServer } from "../../server/joy-api-dev-server";
import { JoyApiServer } from "../../joy-server/server/joy-api-server";
import { JoyDevServer } from "../../server/joy-dev-server";
import { JoyServer } from "../../joy-server/server/joy-server";
import { ServerApplication } from "@symph/server";
import { ConfigService } from "@symph/config";
import { JoyServerConfiguration } from "../../joy-server/server/joy-server.configuration";

// @Configuration({imports: {joyReactConfig: JoyReactConfiguration}})
// export class JoyServerConfig {
//   @Configuration.Provider()
//   public joyAppConfig: JoyAppConfig
//
//   @Configuration.Provider()
//   public serverConfig: ServerConfig;
//
//   @Configuration.Provider()
//   public joyReactServer: JoyReactServer;
//
//   @Configuration.Provider()
//   public joyApiServer: JoyApiServer;
//
//   @Configuration.Provider()
//   public joyServer: JoyServer;
// }

@CommandProvider()
export class JoyStartCommand extends JoyCommand {
  private dir: string;

  constructor(@Autowire() protected configService: ConfigService, @Autowire() protected appContext: ServerApplication) {
    super(appContext);
  }
  getName(): string {
    return "start";
  }

  options() {
    return {
      port: { alias: "p", type: "number" as const, default: 3000 },
      hostname: { type: "string" as const, default: "localhost" },
    };
  }

  async startServer(appContext: ServerApplication): Promise<JoyServer> {
    await appContext.loadModule([
      // ...getServerAutoGenerateModules(distDir),
      JoyServerConfiguration,
    ]);

    const config = await appContext.get(JoyAppConfig);
    const { dir, hostname, port } = config;
    const server = await appContext.get(JoyServer);

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
    process.env.NODE_ENV = "production";

    const dir = args._[0] || ".";
    const { port, hostname } = args;
    const appUrl = `http://${hostname}:${port}`;
    const { _, $0, ...argOpts } = args;
    this.configService.mergeConfig({ dir, hostname, port, dev: false, ...argOpts });
    try {
      const server = await this.startServer(this.appContext);
      // await server.prepare();
      console.log(`started server on http://${args["--hostname"] || "localhost"}:${port}`);
    } catch (err) {
      console.error(err);
      printAndExit(undefined, 1);
    }
  }
}
