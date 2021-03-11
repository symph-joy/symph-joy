import { join } from "path";
import chalk from "chalk";
import yargs, {
  Arguments,
  Argv,
  InferredOptionTypes,
  Omit,
  Options,
} from "yargs";
import getCwd from "./util/getCwd";
import getPkg from "./util/getPkg";
import { JoyBoot } from "../joy-boot";
import { PresetJoyCore } from "../preset-joy-core";
console.log(">>> fork dev, process.argv:", process.argv);
const args = yargs.exitProcess(false).parse(process.argv.slice(2)).argv;
console.log(">>> fork dev, args:", args);

(async () => {
  try {
    // @ts-ignore
    process.env.NODE_ENV = "development";

    const joyBoot = new JoyBoot(PresetJoyCore);
    await joyBoot.init();

    await joyBoot.runCommand({ name: "dev", args });

    let closed = false;
    // kill(2) Ctrl-C
    process.once("SIGINT", () => onSignal("SIGINT"));
    // kill(3) Ctrl-\
    process.once("SIGQUIT", () => onSignal("SIGQUIT"));
    // kill(15) default
    process.once("SIGTERM", () => onSignal("SIGTERM"));

    function onSignal(signal: string) {
      if (closed) return;
      closed = true;

      // TODO 退出时触发插件中的onExit事件
      // service.applyPlugins({
      //   key: 'onExit',
      //   type: service.ApplyPluginsType.event,
      //   args: {
      //     signal,
      //   },
      // });
      process.exit(0);
    }
  } catch (e) {
    console.error(chalk.red(e.message));
    console.error(e.stack);
    process.exit(1);
  }
})();
