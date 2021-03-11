export interface ICommandMeta {
  name: string;
  alias?: string;
  description?: string;
  details?: string;
  // fn: {
  //   // ({ args }: { args: yargs.Arguments }): void;
  //   ({ args }: { args: any }): void;
  // };
}
