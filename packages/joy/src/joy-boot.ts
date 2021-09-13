import { EntryType } from "@symph/core";
import { CommandCenter } from "./command/command-center";
import { NestApplicationOptions, ServerApplication } from "@symph/server";
import { ServerConfiguration } from "@symph/server/dist/server.configuration";
import { JoyBootRuntimeConfiguration } from "./joy-boot-runtime.configuration";
import { JoyBootConfiguration } from "./joy-boot.configuration";

export class JoyBoot extends ServerApplication {
  constructor(protected readonly entry: EntryType, protected readonly appOptions: NestApplicationOptions = {}, public readonly bootRuntimeConfigClass: typeof JoyBootRuntimeConfiguration = JoyBootRuntimeConfiguration) {
    super(entry, JoyBootConfiguration, appOptions);
  }

  public async startBoot(): Promise<void> {
    await this.loadModule(this.bootRuntimeConfigClass);
  }

  async initServer(): Promise<this> {
    return super.init();
  }

  async init(): Promise<this> {
    console.debug("Should not call joyBoot.init() directly, use initServer() instead of init().");
    return super.init();
  }

  public async runCommand(name: string, args: any = {}): Promise<any> {
    const commandCenter = await this.get<CommandCenter>(CommandCenter);
    if (!commandCenter) {
      throw new Error(`run command ${name} failed, commandCenter provider is not provided`);
    }
    return commandCenter.runCommand(name, args);
  }
}
