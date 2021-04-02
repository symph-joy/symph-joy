import { CommandProvider } from "../command-provider.decorator";
// import yargs = require('yargs');
// import yargs from "yargs";
import { JoyCommand, JoyCommandOptionType } from "../command";
import { printAndExit } from "../../server/lib/utils";
import { Configuration, CoreContext, Inject } from "@symph/core";
import http from "http";
import { JoyAppConfig } from "../../next-server/server/joy-config/joy-app-config";
import { NextServer } from "../../next-server/server/next-server";
import { ServerConfig } from "../../next-server/server/server-config";

@Configuration()
export class JoyServerConfig {
  @Configuration.Provider()
  public serverConfig: ServerConfig;

  @Configuration.Provider()
  public joyServer: NextServer;
}

@CommandProvider()
export class JoyStartCommand extends JoyCommand {
  private dir: string;

  constructor(
    private joyAppConfig: JoyAppConfig,
    @Inject() private appContext: CoreContext
  ) {
    super();
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

  async startServer(appContext: CoreContext): Promise<NextServer> {
    await appContext.loadModule(JoyServerConfig);
    const config = this.joyAppConfig;
    const { dir, hostname, port } = config;
    const server = await appContext.get(NextServer);

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

    return server;
  }

  async run(args: JoyCommandOptionType<this>): Promise<any> {
    // @ts-ignore
    process.env.NODE_ENV = "production";

    const dir = args._[0] || ".";
    const { port, hostname } = args;
    const appUrl = `http://${hostname}:${port}`;
    this.joyAppConfig.mergeCustomConfig({ dir, hostname, port, dev: false });
    try {
      const server = await this.startServer(this.appContext);
      await server.prepare();
    } catch (err) {
      console.error(err);
      printAndExit(undefined, 1);
    }
  }
}
