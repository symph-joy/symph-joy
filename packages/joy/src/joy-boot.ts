import { CoreContext, EntryType, JoyContainer } from "@symph/core";
import { CommandCenter } from "./command/command-center";
import { JoyAppConfig } from "./next-server/server/joy-config/joy-app-config";

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

  async runCommand({ name, args = {} }: { name: string; args?: any }) {
    console.log(">>>> runCommand ", name, args);
    const commandCenter = await this.get<CommandCenter>(CommandCenter);
    if (!commandCenter) {
      throw new Error(
        `run command ${name} failed, commandCenter provider is not provided`
      );
    }
    return commandCenter.runCommand({ name, args });
  }
}
