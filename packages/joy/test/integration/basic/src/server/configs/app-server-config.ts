import { Configuration } from "@symph/core";

@Configuration()
export class AppServerConfig {
  constructor() {
    console.log(">>>> loading");
  }
}
