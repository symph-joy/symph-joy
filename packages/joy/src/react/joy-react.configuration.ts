import { Configuration } from "@symph/core";
import { ReactContextFactory } from "./react-context-factory";
import { JoyReactServer } from "../joy-server/server/joy-react-server";

@Configuration()
export class JoyReactConfiguration {
  @Configuration.Provider()
  public reactContextFactory: ReactContextFactory;

  @Configuration.Provider()
  public joyReactServer: JoyReactServer;
}
