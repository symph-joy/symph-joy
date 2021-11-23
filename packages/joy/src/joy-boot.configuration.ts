import { Configuration } from "@symph/core";
import { CommandConfiguration } from "./command/command.configuration";
import { ServerConfiguration } from "@symph/server/dist/server.configuration";
import { JoyConfigConfiguration } from "./joy-server/server/joy-config.configuration";

@Configuration()
export class JoyBootConfiguration extends ServerConfiguration {
  @Configuration.Provider()
  public configConfiguration: JoyConfigConfiguration;

  @Configuration.Provider()
  public commandConfiguration: CommandConfiguration;
}
