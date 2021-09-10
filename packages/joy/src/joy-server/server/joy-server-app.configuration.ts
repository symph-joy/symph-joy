import { Configuration } from "@symph/core";
import { JoyReactConfiguration } from "../../react/joy-react.configuration";
import { JoyServerConfiguration } from "./joy-server.configuration";

@Configuration()
export class JoyServerAppConfiguration extends JoyServerConfiguration {
  // ====== imports
  @Configuration.Provider()
  joyReactConfiguration: JoyReactConfiguration;
}
