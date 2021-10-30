import assert from "assert";
import { ICommandHandler } from "./interface/command-handler.interface";
import { getCommandsMetadata } from "./command.decorator";
import { IComponentWrapper, Component, InjectorHookTaps, RegisterTap, Type, EntryType, ProviderScanner } from "@symph/core";
import { getCommandMetadata } from "./command-provider.decorator";
import { JoyCommand } from "./command";

@Component()
export class CommandCenter implements InjectorHookTaps {
  public commands: {
    [name: string]: ICommandHandler | string;
  } = {};

  @RegisterTap()
  componentAfterInitialize<T = any>(instance: T, args: { instanceWrapper: IComponentWrapper }): T {
    const { instanceWrapper } = args;
    this.registerCommand(instance, instanceWrapper.type as Type);
    return instance;
  }

  public registerCommand(instance: Object, commandClazz?: Type) {
    if (commandClazz === undefined) {
      commandClazz = instance.constructor as Type;
    }
    // register provider's method as a command
    const commandHandlers = getCommandsMetadata(commandClazz);
    commandHandlers &&
      commandHandlers.length &&
      commandHandlers.forEach((handler) => {
        handler.provider = instance;
        this.registerCommandHandler(handler);
      });

    // register provider as a command
    const commandHandler = getCommandMetadata(commandClazz);
    if (commandHandler && JoyCommand.isJoyCommand(instance)) {
      // this provider is a command handler
      const handler: ICommandHandler<JoyCommand> = {
        command: {
          name: instance.getName(),
          alias: instance.alias(),
        },
        methodKey: "start",
        provider: instance,
      };
      this.registerCommandHandler(handler);
    }
  }

  private registerCommandHandler(command: ICommandHandler) {
    const { name, alias } = command.command;
    assert(!this.commands[name], `registerCommand() failed, the command ${name} is exists.`);
    this.commands[name] = command;
    if (alias) {
      this.commands[alias] = name;
    }
  }

  /**
   *
   * @param name command name
   * @param args custom args
   */
  async runCommand(name: string, args: any = {}): Promise<any> {
    args._ = args._ || [];
    // shift the command itself
    if (args._[0] === name) args._.shift();

    const command = typeof this.commands[name] === "string" ? this.commands[this.commands[name] as string] : this.commands[name];
    assert(command, `run command failed, command "${name}" does not exists.`);

    const { provider, methodKey } = command as ICommandHandler;
    if (provider === undefined || provider === null) {
      throw new Error(`run command failed, command "${name}" does not initialized`);
    }
    return provider[methodKey](args);
  }
}
