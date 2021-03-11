import { JoyContainer } from "@symph/core";

export interface IJoyBootContext extends JoyContainer {
  cwd: string;
  config: Object;
}
