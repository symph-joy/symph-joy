import { Configuration } from "@symph/core";
import { JoyServerConfiguration } from "../joy-server/server/joy-server.configuration";
import { JoyExportAppService } from "../export/joy-export-app.service";
import { JoyPrerenderServer } from "../build/prerender/joy-prerender-server";

@Configuration()
export class JoyExportConfiguration extends JoyServerConfiguration {
  @Configuration.Component()
  public joyPrerenderServer: JoyPrerenderServer;

  @Configuration.Component()
  public joyExportAppService: JoyExportAppService;
}
