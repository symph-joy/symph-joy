import { Configuration, IConfigurationOptions } from "@symph/core";
import { ReactComponent } from "./react-component.decorator";
import { Provider } from "@symph/core/dist/decorators/core/configuration/provider.decorator";

export function ReactConfiguration(options: IConfigurationOptions = {}): ClassDecorator {
  return (target) => {
    Configuration(options)(target);
    ReactComponent()(target);
  };
}

ReactConfiguration.Provider = Provider;
