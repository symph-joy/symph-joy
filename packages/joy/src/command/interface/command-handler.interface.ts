import { ICommandMeta } from "./command-meta.interface";
import { JoyCommand } from "../command";

export interface ICommandHandler<T = any> {
  command: ICommandMeta;
  provider?: T;
  methodKey: keyof T;
}
