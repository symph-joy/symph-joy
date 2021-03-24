import { join } from "path";
import chalk from "chalk";
import { existsSync } from "fs";
import fork from "./util/fork";

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

(async () => {
  try {
    const child = fork({
      scriptPath: require.resolve("./fork-start-joy"),
    });
    // ref:
    // http://nodejs.cn/api/process/signal_events.html
    process.on("SIGINT", () => {
      child.kill("SIGINT");
    });
    process.on("SIGTERM", () => {
      child.kill("SIGTERM");
    });

  } catch (e) {
    console.error(chalk.red(e.message));
    console.error(e.stack);
    process.exit(1);
  }
})();
