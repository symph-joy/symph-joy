import { Configuration } from "@symph/core";
import { JoyReactAppServerConfig } from "./joy-react-app-server-config";
import { JoyReactRouterServerDev } from "../../router/joy-react-router-server-dev";

@Configuration({ imports: [] })
export class JoyReactAppServerDevConfig extends JoyReactAppServerConfig {
  @Configuration.Provider()
  public reactRouter: JoyReactRouterServerDev;
}
