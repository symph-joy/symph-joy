import "@babel/runtime/regenerator";
import chalk from "chalk";
import { JoyBoot } from "../joy-boot";
import { JoyBootConfiguration } from "../joy-boot.configuration";
import yargs from "yargs";
import { existsSync } from "fs";
import { join } from "path";
import { ServerFactory } from "@symph/server";
import { JoyBootFactory } from "../joy-boot-factory";
import { CommandCenter } from "../command/command-center";

export const startJoy = (async () => {
  let closed = false;
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

  let command = String(args._[0]);
  if (!command) {
    if (args.version) {
      command = "version";
      process.argv.splice(2, 0, "version");
      const local = existsSync(join(__dirname, "../.local")) ? chalk.cyan("@local") : "";
      console.log(`joy@${require("../../package.json").version}${local}`);
    } else {
      command = "help";
      process.argv.splice(2, 0, "help");
    }
  }

  const joyBoot = await JoyBootFactory.createServer({});
  // await joyBoot.init();

  function onSignal(signal: string) {
    if (closed) return;
    closed = true;
    // TODO 退出时触发插件中的onExit事件
    // example: joyBoot.onExitHook(signal)
    process.exit(0);
  }
  // kill(2) Ctrl-C
  process.once("SIGINT", () => onSignal("SIGINT"));
  // kill(3) Ctrl-\
  process.once("SIGQUIT", () => onSignal("SIGQUIT"));
  // kill(15) default
  process.once("SIGTERM", () => onSignal("SIGTERM"));

  return await joyBoot.runCommand(command);
})();
