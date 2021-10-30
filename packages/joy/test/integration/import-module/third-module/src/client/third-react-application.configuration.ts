import ThirdHelloReactController from "./pages/index";
import ThirdEmbedView1 from "./pages/embed/view1";
import { ReactConfiguration } from "@symph/react/dist/react-configuration.decorator";
import { ThirdFetchService } from "./service/third-fetch.service";

@ReactConfiguration()
export class ThirdReactApplicationConfiguration {
  @ReactConfiguration.Provider()
  public thirdHelloReactController: ThirdHelloReactController;

  @ReactConfiguration.Provider()
  public thirdEmbedView1: ThirdEmbedView1;

  @ReactConfiguration.Provider()
  public thirdFetchService: ThirdFetchService;
}
