import { Configuration } from "@symph/core";
import { JoyReactDevConfiguration } from "../react/joy-react-dev.configuration";
import { JoyServerConfiguration } from "../joy-server/server/joy-server.configuration";
import { BuildDevConfig } from "./build-dev-config";
import { JoyConfigDevConfiguration } from "./joy-config-dev.configuration";

@Configuration()
// export abstract class JoyDevConfiguration extends JoyBuildConfiguration {
export class JoyDevConfiguration extends JoyServerConfiguration {
  // // ====== imports

  // @Configuration.Component()
  // buildConfiguration: BuildDevConfiguration;

  @Configuration.Component()
  public buildConfig: BuildDevConfig;

  @Configuration.Component()
  joyReactConfiguration: JoyReactDevConfiguration;

  @Configuration.Component()
  configConfiguration: JoyConfigDevConfiguration;
}

// // 去掉configConfiguration的组件配置，开发模式下，使用父容器中configConfiguration配置的组件。
// const comps = getConfigurationProviders(JoyDevConfiguration);
// const newComps = [...comps];
// const cleanCompName = ["configConfiguration", "applicationConfig"];
// cleanCompName.forEach((compName) => {
//   const index = newComps.findIndex((it) => it.name === compName);
//   if (index >= 0) {
//     newComps.splice(index, 1);
//   } else {
//     console.error('JoyDevConfiguration cannot find the configuration of  "configConfiguration" and remove it');
//   }
// });
// Reflect.defineMetadata(METADATA.PROVIDERS, newComps, JoyDevConfiguration.prototype);
