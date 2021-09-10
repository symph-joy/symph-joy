import yargs, { Arguments, InferredOptionTypes, Options } from "yargs";
import { merge } from "lodash";

export interface ICommand<T extends { [key: string]: Options }> {
  command: string;
  options: T;
  argv: yargs.Argv<this["options"]>;

  run(): any;
}

// const argv = yargs.options({
//   port: { type: 'number', default: 3000 },
//   aaa: { type: 'string' },
// });

export type JoyCommandOptionType<T extends JoyCommand> = Arguments<InferredOptionTypes<ReturnType<T["options"]>>>;

export abstract class JoyCommand {
  abstract getName(): string;

  public alias(): string | undefined {
    return undefined;
  }

  public start(args: Record<string, any>) {
    const argv = yargs.exitProcess(false).options(this.options()).argv;
    argv._ = argv._.slice(1); // 第一个元素是命令名称，在命令处理函数的内部不需要该值。
    if (args) {
      args = merge(argv, args);
    }
    // const {_, $0, ...opt} = args
    // this.configService.mergeConfig(opt)
    return this.run(args as any);
  }

  abstract options(): { [key: string]: Options };

  abstract run(args: JoyCommandOptionType<this>): any;

  static isJoyCommand(provider: unknown): provider is JoyCommand {
    return provider !== undefined && provider !== null && provider instanceof JoyCommand;
  }
}
