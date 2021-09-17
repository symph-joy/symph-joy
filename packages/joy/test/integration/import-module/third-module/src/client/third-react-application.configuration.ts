import HelloReactController from "./pages/index";
import EmbedView1 from "./pages/embed/view1";
import { ReactConfiguration } from "@symph/react/dist/react-configuration.decorator";
import { ThirdFetchService } from "./service/third-fetch.service";

@ReactConfiguration()
export class ThirdReactApplicationConfiguration {
  @ReactConfiguration.Provider()
  public helloReactController: HelloReactController;

  @ReactConfiguration.Provider()
  public embedView1: EmbedView1;

  // @ReactConfiguration.Provider()
  // public thirdFetchService: ThirdFetchService;
}
