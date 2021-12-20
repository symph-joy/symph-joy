import { ClassComponent } from "@symph/core";
import { ReactComponent } from "./react-component.decorator";

export function ReactModel(options: Partial<ClassComponent> = {}): ClassDecorator {
  return (target) => {
    return ReactComponent(Object.assign({ lazyRegister: true }, options))(target);
  };
}
