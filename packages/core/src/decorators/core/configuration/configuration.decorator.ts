import { CONFIGURATION_METADATA } from "../../../constants";
import { Provider } from "./provider.decorator";
import { Type } from "../../../interfaces";

export interface IConfigurationOptions {
  imports?: Array<any>;
}

// todo import 需要数组合并，否则子类的配置会覆盖父类的配置
export function Configuration(
  options: IConfigurationOptions = {}
): ClassDecorator {
  return (target) => {
    const config = Object.assign({}, options);
    Reflect.defineMetadata(CONFIGURATION_METADATA, config, target);
  };
}

export function getConfigurationMeta(
  val: any
): IConfigurationOptions | undefined {
  const configMetaData = Reflect.getMetadata(CONFIGURATION_METADATA, val);
  return configMetaData;
}

Configuration.Provider = Provider;
