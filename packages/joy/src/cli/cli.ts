import { join } from "path";
import chalk from "chalk";
import { existsSync } from "fs";
import fork from "./util/fork";
import getCwd from "./util/getCwd";
import getPkg from "./util/getPkg";

import yargs, {
  Arguments,
  Argv,
  InferredOptionTypes,
  Omit,
  Options,
} from "yargs";

console.dir("process.argv", process.argv);
// process.argv: [node, umi.js, command, args]
const args = yargs
  .exitProcess(false)
  .options({
    version: {
      alias: "v",
    },
    help: {
      alias: "h",
    },
  })
  .parse(process.argv.slice(2));

if (args.version && !args._[0]) {
  args._[0] = "version";
  const local = existsSync(join(__dirname, "../.local"))
    ? chalk.cyan("@local")
    : "";
  console.log(`joy@${require("../../package.json").version}${local}`);
} else if (!args._[0]) {
  args._[0] = "help";
}
console.log(">>> args", args);

(async () => {
  try {
    switch (args._[0]) {
      case "dev":
        const child = fork({
          scriptPath: require.resolve("./fork-dev"),
        });
        // ref:
        // http://nodejs.cn/api/process/signal_events.html
        process.on("SIGINT", () => {
          child.kill("SIGINT");
        });
        process.on("SIGTERM", () => {
          child.kill("SIGTERM");
        });
        break;
      default:
        const name = args._[0];
        if (name === "build") {
          // @ts-ignore
          process.env.NODE_ENV = "production";
        }
        // todo 实现：启动生产环境服务器
        // await new Service({
        //   cwd: getCwd(),
        //   pkg: getPkg(process.cwd()),
        // }).run({
        //   name,
        //   args,
        // });
        break;
    }
  } catch (e) {
    console.error(chalk.red(e.message));
    console.error(e.stack);
    process.exit(1);
  }
})();
