import { ReactComponent } from "@symph/react";
import { JoyModuleFetchService, JoyFetchService, Mount } from "@symph/joy/react";

@ReactComponent()
export class ThirdFetchService extends JoyModuleFetchService {
  constructor(public joyFetchService: JoyFetchService) {
    super(joyFetchService);
    console.log(">>>> ThirdFetchService， mount", this.getMount());
  }
}
