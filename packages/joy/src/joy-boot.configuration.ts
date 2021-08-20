import { Configuration } from "@symph/core";
import { CommandConfiguration } from "./command/command.configuration";
import { NodeConfigConfiguration } from "@symph/config";
import { ServerConfiguration } from "@symph/server/dist/server.configuration";

export class JoyBootConfigConfiguration extends NodeConfigConfiguration {
  protected isAutoLoadConfig(): boolean {
    return false;
  }
}

@Configuration()
export class JoyBootConfiguration extends ServerConfiguration {
  @Configuration.Provider()
  public configConfiguration: JoyBootConfigConfiguration;

  @Configuration.Provider()
  public commandConfiguration: CommandConfiguration;
}
