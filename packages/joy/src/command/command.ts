import yargs, { Arguments, Argv, InferredOptionTypes, Omit, Options } from "yargs";
import { Type } from "ast-types";
import { instanceOf } from "prop-types";
import { merge } from "lodash";
import { ConfigService } from "@symph/config";
import { CoreContext, Inject } from "@symph/core";
import { ServerApplication } from "@symph/server";

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
  // protected argv: Arguments<InferredOptionTypes<ReturnType<this['options']>>>

  constructor(
    // @Inject() protected configService: ConfigService,
    @Inject() protected appContext: CoreContext
  ) {}

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

  static isJoyCommand(provider: Object): provider is JoyCommand {
    return provider && provider instanceof JoyCommand;
  }
}
