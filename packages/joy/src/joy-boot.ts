import { CoreContext, EntryType, JoyContainer } from "@symph/core";
import { CommandCenter } from "./command/command-center";
import { JoyAppConfig } from "./joy-server/server/joy-config/joy-app-config";

export class JoyBoot extends CoreContext {
  // public commandCenter: CommandCenter = new CommandCenter()

  constructor(protected readonly entry: EntryType, container?: JoyContainer) {
    super(entry, container);
    this.initInternalProviders();
  }

  private initInternalProviders(): void {
    this.registerInternalModules({
      joyAppConfig: {
        id: "joyAppConfig",
        useClass: JoyAppConfig,
      },
      CommandCenter,
    });
    // this.registerInternalModules(presetJoyCommands)
    // this.container.addProvider(getInjectableMeta(CommandCenter))
    // this.container.addProvider(getInjectableMeta(FileJoyAppConfig))
  }

  async runCommand(name: string, args: any = {}): Promise<any> {
    const commandCenter = await this.get<CommandCenter>(CommandCenter);
    if (!commandCenter) {
      throw new Error(
        `run command ${name} failed, commandCenter provider is not provided`
      );
    }
    return commandCenter.runCommand(name, args);
  }
}
