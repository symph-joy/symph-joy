import { Configuration } from "@symph/core";
import { JoyServerConfiguration } from "../joy-server/server/joy-server.configuration";
import { JoyExportAppService } from "../export/joy-export-app.service";

@Configuration()
export class JoyExportConfiguration extends JoyServerConfiguration {
  @Configuration.Provider()
  public joyExportAppService: JoyExportAppService;
}
