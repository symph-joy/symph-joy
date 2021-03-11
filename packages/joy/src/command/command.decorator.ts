import { ICommandMeta } from "./interface/command-meta.interface";
import { Type } from "@symph/core";
import { ICommandHandler } from "./interface/command-handler.interface";

export function Command(hookOptions?: Partial<ICommandMeta>) {
  return (target: Object, propertyKey: string) => {
    const command: ICommandMeta = Object.assign(
      {},
      {
        name: propertyKey,
      },
      hookOptions
    );

    const handler: ICommandHandler = {
      command,
      provider: undefined,
      methodKey: propertyKey,
    };

    const handlers = getCommandsMetadata(target) || [];
    handlers.push(handler);

    Reflect.defineMetadata("__joy_cmds", handlers, target);
  };
}

export function getCommandsMetadata(
  targetType: Object | Type
): ICommandHandler[] {
  return Reflect.getMetadata(
    "__joy_cmds",
    typeof targetType === "function" ? targetType.prototype : targetType
  ) as ICommandHandler[];
}
