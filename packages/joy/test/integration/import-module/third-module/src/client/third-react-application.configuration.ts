import ThirdHelloReactController from "./pages/index";
import ThirdEmbedView1 from "./pages/embed/view1";
import { ReactConfiguration } from "@symph/react/dist/react-configuration.decorator";
import { ThirdFetchService } from "./service/third-fetch.service";

@ReactConfiguration()
export class ThirdReactApplicationConfiguration {
  @ReactConfiguration.Component()
  public thirdHelloReactController: ThirdHelloReactController;

  @ReactConfiguration.Component()
  public thirdEmbedView1: ThirdEmbedView1;

  @ReactConfiguration.Component()
  public thirdFetchService: ThirdFetchService;
}
