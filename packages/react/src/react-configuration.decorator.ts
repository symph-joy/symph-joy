import { Configuration, IConfigurationOptions } from "@symph/core";
import { ReactComponent } from "./react-component.decorator";
import { Component } from "@symph/core/dist/decorators/core/configuration/configuration-component.decorator";

export function ReactConfiguration(options: IConfigurationOptions = {}): ClassDecorator {
  return (target) => {
    Configuration(options)(target);
    ReactComponent()(target);
  };
}

ReactConfiguration.Component = Component;
