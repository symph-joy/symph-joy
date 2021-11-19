import { CommandProvider } from "../command-provider.decorator";
import { JoyCommand, JoyCommandOptionType } from "../command";
import { printAndExit } from "../../server/lib/utils";
import { JoyAppConfig } from "../../joy-server/server/joy-app-config";
import { JoyServerAppConfiguration } from "../../joy-server/server/joy-server-app.configuration";
import { JoyServerFactory } from "../../joy-server/server/joy-server-factory";
import { JoyServerApplication } from "../../joy-server/server/joy-server-application";

@CommandProvider()
export class JoyStartCommand extends JoyCommand {
  getName(): string {
    return "start";
  }

  options() {
    return {
      port: { alias: "p", type: "number" as const, default: 3000 },
      hostname: { type: "string" as const, default: "localhost" },
    };
  }

  async startServer(appContext: JoyServerApplication): Promise<void> {
    const config = await appContext.get(JoyAppConfig);
    const { dir, hostname, port } = config;
    await appContext.prepare();

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
  }

  async run(args: JoyCommandOptionType<this>): Promise<any> {
    // @ts-ignore
    process.env.NODE_ENV = "production";

    const dir = args._[0] || ".";
    const { port, hostname } = args;
    const appUrl = `http://${hostname}:${port}`;
    const { _, $0, ...argOpts } = args;

    const appContext = await JoyServerFactory.createServer({}, JoyServerAppConfiguration, { dir, hostname, port, dev: false, ...argOpts });

    try {
      const server = await this.startServer(appContext);
      console.log(`started server on http://${args["--hostname"] || "localhost"}:${port}`);
    } catch (err) {
      console.error(err);
      printAndExit(undefined, 1);
    }
  }
}
