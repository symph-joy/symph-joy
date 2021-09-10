import { Component, Optional } from "@symph/core";
import { ServerApplication } from "@symph/server";
import { JoyServer } from "../joy-server/server/joy-server";
import { JoyAppConfig } from "../joy-server/server/joy-app-config";
import HotReloader from "./hot-reloader";
import { JoyReactServer } from "../joy-server/server/joy-react-server";

@Component()
export class JoyDevServer extends JoyServer {
  constructor(protected appContext: ServerApplication, public joyAppConfig: JoyAppConfig, @Optional() public reactServer: JoyReactServer, protected hotReloader: HotReloader) {
    super(appContext, joyAppConfig, reactServer);
  }

  async prepareApiComponent(): Promise<void> {
    await this.hotReloader.start();
    const genFilePath = this.joyAppConfig.resolveAutoGenOutDir("./joy/server-providers.config.js");
    await this.hotReloader.ensureModules([genFilePath]);

    const joyApiModulesPath = this.joyAppConfig.resolveBuildOutDir("joy/server-bundle.js");
    const joyApiModules = require(joyApiModulesPath).default;
    await this.appContext.loadModule(joyApiModules);
  }
}
