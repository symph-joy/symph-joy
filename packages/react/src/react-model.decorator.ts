import { ClassProvider } from "@symph/core";
import { ReactComponent } from "./react-component.decorator";

export function ReactModel(options: Partial<ClassProvider> = {}): ClassDecorator {
  return (target) => {
    return ReactComponent(Object.assign({ autoRegister: true }, options))(target);
  };
}
