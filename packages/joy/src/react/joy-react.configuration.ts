import { Configuration } from "@symph/core";
import { ReactContextFactory } from "./react-context-factory";
import { JoyReactServer } from "../joy-server/server/joy-react-server";

@Configuration()
export class JoyReactConfiguration {
  @Configuration.Component()
  public reactContextFactory: ReactContextFactory;

  @Configuration.Component()
  public joyReactServer: JoyReactServer;
}
