import { ReactRouterServer } from "./router/react-router-server";
import { Configuration } from "@symph/core";
import { StaticRouter } from "react-router-dom/server";
import { ReactApplicationConfiguration } from "@symph/react";
import { ReactFetchServerService } from "./service/react-fetch-server.service";
import { JoyAppConfig } from "../joy-server/server/joy-app-config";
import { REACT_OUT_DIR } from "./react-const";
import path from "path";
import { JoyReactApplicationContext } from "./joy-react-application-context";

@Configuration()
export class JoyReactAppServerConfiguration extends ReactApplicationConfiguration {
  constructor(private joyAppConfig: JoyAppConfig, private context: JoyReactApplicationContext) {
    super();

    const distDir = this.joyAppConfig.resolveAppDir(this.joyAppConfig.distDir);
    const genServerModulesPath = path.join(distDir, REACT_OUT_DIR, "server/gen-server-modules.js");
    const modules = require(genServerModulesPath);
    this.context.registerPreGenModule(modules.default || modules);
  }

  // @RegisterTap()
  // onContextInitialized() {
  //
  // }

  @Configuration.Component()
  public reactRouterComponent(): (props: any) => JSX.Element {
    return StaticRouter;
  }

  @Configuration.Component()
  public reactRouterService: ReactRouterServer;

  @Configuration.Component()
  public joyFetchService: ReactFetchServerService;
}
