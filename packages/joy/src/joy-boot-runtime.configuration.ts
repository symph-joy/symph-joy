import { Configuration } from "@symph/core";
import { CommandConfiguration } from "./command/command.configuration";
import { JoyConfigConfiguration } from "./joy-server/server/joy-config.configuration";

@Configuration()
export class JoyBootRuntimeConfiguration {
  @Configuration.Component()
  public configConfiguration: JoyConfigConfiguration;

  @Configuration.Component()
  public commandConfiguration: CommandConfiguration;
}
