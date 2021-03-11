import yargs, {
  Arguments,
  Argv,
  InferredOptionTypes,
  Omit,
  Options,
} from "yargs";

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

abstract class DevCommand1 {
  command = "dev1";
  getCommand() {
    return "dev";
  }
  // options(){
  //   return {
  //     aaa: {type: 'number' as "number"},
  //   };
  // }

  abstract options(): { [key: string]: Options };

  getArgs<T extends ReturnType<this["options"]>>() {
    return yargs.options(this.options() as T).argv;
  }

  abstract run(): any;
}

// class A extends DevCommand1 {
//
//   // options(){
//   //   return {
//   //     aaa: {type: 'number' as "number"},
//   //   };
//   // }
//
//   run(): any {
//     this.getArgs().aaaa
//   }
//
//   port = 30000
//
//   options() {
//       return {
//         aaaa: {default: this.port},
//       };
//   }
//
//
// }
