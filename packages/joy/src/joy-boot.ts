import { CoreContext, EntryType, JoyContainer } from "@symph/core";
import { CommandCenter } from "./command/command-center";
import { JoyAppConfig } from "./joy-server/server/joy-config/joy-app-config";
import {
  ApplicationConfig,
  HttpServer,
  NestApplicationOptions,
  ServerApplication,
} from "@symph/server";
import { ServerContainer } from "@symph/server/dist/server-container";

export class JoyBoot extends ServerApplication {
  // public commandCenter: CommandCenter = new CommandCenter()

  constructor(
    protected readonly entry: EntryType,
    httpAdapter: HttpServer,
    // protected readonly config: ApplicationConfig,
    appOptions: NestApplicationOptions = {},
    public container: ServerContainer = new ServerContainer()
  ) {
    super(entry, httpAdapter, appOptions, container);
    // this.registerInternalProviders();
  }

  protected async initContext(): Promise<string[]> {
    const superIds = await super.initContext();
    const myIds = await this.loadModule({
      joyAppConfig: {
        id: "joyAppConfig",
        useClass: JoyAppConfig,
      },
      CommandCenter,
    });
    return [...superIds, ...myIds];
  }

  // private registerInternalProviders(): void {
  //   this.registerInternalModules({
  //     joyAppConfig: {
  //       id: "joyAppConfig",
  //       useClass: JoyAppConfig,
  //     },
  //     CommandCenter,
  //   });
  // }

  public async runCommand(name: string, args: any = {}): Promise<any> {
    const commandCenter = await this.get<CommandCenter>(CommandCenter);
    if (!commandCenter) {
      throw new Error(
        `run command ${name} failed, commandCenter provider is not provided`
      );
    }
    return commandCenter.runCommand(name, args);
  }
}
