import { EntryType } from "@symph/core";
import { CommandCenter } from "./command/command-center";
import { NestApplicationOptions, ServerApplication } from "@symph/server";
import { ServerConfiguration } from "@symph/server/dist/server.configuration";
import { JoyBootConfiguration } from "./joy-boot.configuration";

export class JoyBoot extends ServerApplication {
  // public commandCenter: CommandCenter = new CommandCenter()

  constructor(
    protected readonly entry: EntryType,
    public readonly configurationClass: typeof ServerConfiguration = JoyBootConfiguration,
    protected readonly appOptions: NestApplicationOptions = {} // httpAdapter: HttpServer, // protected readonly config: ApplicationConfig, // appOptions: NestApplicationOptions = {}, // public container: ServerContainer = new ServerContainer()
  ) {
    super(entry, configurationClass, appOptions);
    // this.registerInternalProviders();
  }

  public async runCommand(name: string, args: any = {}): Promise<any> {
    const commandCenter = await this.get<CommandCenter>(CommandCenter);
    if (!commandCenter) {
      throw new Error(`run command ${name} failed, commandCenter provider is not provided`);
    }
    return commandCenter.runCommand(name, args);
  }
}
