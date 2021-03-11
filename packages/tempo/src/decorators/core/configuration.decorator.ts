import { CONFIGURATION_METADATA } from "../../constants";

export function Configuration(options = {}): ClassDecorator {
  return (target) => {
    const config = Object.assign({}, options);
    Reflect.defineMetadata(CONFIGURATION_METADATA, config, target);
  };
}
