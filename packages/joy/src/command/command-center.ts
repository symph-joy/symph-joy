import assert from "assert";
import { ICommandHandler } from "./interface/command-handler.interface";
import { getCommandsMetadata } from "./command.decorator";
import {
  IInstanceWrapper,
  Injectable,
  InjectorHookTaps,
  Tap,
} from "@symph/core";
import { getCommandMetadata } from "./command-provider.decorator";
import { JoyCommand } from "./command";

@Injectable()
export class CommandCenter implements InjectorHookTaps {
  public commands: {
    [name: string]: ICommandHandler | string;
  } = {};

  @Tap()
  injectorAfterPropertiesSet<T>(
    instance: T,
    args: { instanceWrapper: IInstanceWrapper }
  ): T {
    const { instanceWrapper } = args;
    // register provider's method as a command
    const commandHandlers = getCommandsMetadata(instanceWrapper.type);
    commandHandlers &&
      commandHandlers.length &&
      commandHandlers.forEach((handler) => {
        handler.provider = instance;
        this.registerCommand(handler);
      });

    // register provider as a command
    const commandHandler = getCommandMetadata(instanceWrapper.type);
    if (commandHandler && JoyCommand.isJoyCommand(instance)) {
      // this provider is a command handler
      const handler: ICommandHandler = {
        command: {
          name: instance.getName(),
          alias: instance.alias(),
        },
        methodKey: "start",
        provider: instance,
      };
      this.registerCommand(handler);
    }
    return instance;
  }

  public registerCommand(command: ICommandHandler) {
    const { name, alias } = command.command;
    assert(
      !this.commands[name],
      `registerCommand() failed, the command ${name} is exists.`
    );
    this.commands[name] = command;
    if (alias) {
      this.commands[alias] = name;
    }
  }

  async runCommand({ name, args = {} }: { name: string; args?: any }) {
    args._ = args._ || [];
    // shift the command itself
    if (args._[0] === name) args._.shift();

    const command =
      typeof this.commands[name] === "string"
        ? this.commands[this.commands[name] as string]
        : this.commands[name];
    assert(command, `run command failed, command ${name} does not exists.`);

    const { provider, methodKey } = command as ICommandHandler;
    if (!provider) {
      throw new Error(
        `run command failed, command ${name} does not initialized`
      );
    }
    assert(
      provider,
      `run command failed, command ${name} does not initialized`
    );

    // @ts-ignore
    return provider[methodKey](args);
  }
}