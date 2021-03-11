import { ICommandMeta } from "./command-meta.interface";

export interface ICommandHandler {
  command: ICommandMeta;
  provider?: Object;
  methodKey: string;
}
