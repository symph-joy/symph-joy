import { CONFIGURATION_METADATA } from "../../../constants";
import { Component } from "./configuration-component.decorator";
import { EntryType } from "../../../interfaces";
import { Component as ComponentDec } from "../component.decorator";

export interface IConfigurationOptions {
  imports?: Record<string, EntryType>;
}

export function Configuration(options: IConfigurationOptions = {}): ClassDecorator {
  return (target) => {
    const superMeta = getConfigurationMeta(target) || {};
    const metaData = Object.assign({ imports: {} }, superMeta);
    if (options.imports) {
      for (const importKey of Object.keys(options.imports)) {
        // const superImport = superMeta.imports?.[importKey]
        metaData.imports[importKey] = options.imports?.[importKey];
      }
    }
    Reflect.defineMetadata(CONFIGURATION_METADATA, metaData, target);
    ComponentDec()(target);
  };
}

export function getConfigurationMeta(val: any): IConfigurationOptions | undefined {
  const configMetaData = Reflect.getMetadata(CONFIGURATION_METADATA, val);
  return configMetaData;
}

Configuration.Component = Component;
