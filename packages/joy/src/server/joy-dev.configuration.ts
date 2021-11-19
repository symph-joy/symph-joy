import { Configuration, Provider as ProviderType } from "@symph/core";
import HotReloader from "./hot-reloader";
import { JoyReactDevConfiguration } from "../react/joy-react-dev.configuration";
import { BuildDevConfiguration } from "../build/build-dev.configuration";
import { JoyConfigConfiguration } from "../joy-config.configuration";
import { JoyBuildConfiguration } from "./joy-build.configuration";
import { JoyServerConfiguration } from "../joy-server/server/joy-server.configuration";
import { BuildDevConfig } from "./build-dev-config";
import { getConfigurationProviders } from "@symph/core/dist/decorators/core/configuration/provider.decorator";
import { METADATA } from "@symph/core/dist/constants";

@Configuration()
// export abstract class JoyDevConfiguration extends JoyBuildConfiguration {
export class JoyDevConfiguration extends JoyServerConfiguration {
  // // ====== imports

  // @Configuration.Provider()
  // buildConfiguration: BuildDevConfiguration;

  @Configuration.Provider()
  public buildConfig: BuildDevConfig;

  @Configuration.Provider()
  joyReactConfiguration: JoyReactDevConfiguration;
}

// 去掉configConfiguration的组件配置，开发模式下，使用父容器中configConfiguration配置的组件。
const comps = getConfigurationProviders(JoyDevConfiguration);
const newComps = [...comps];
const cleanCompName = ["configConfiguration", "applicationConfig"];
cleanCompName.forEach((compName) => {
  const index = newComps.findIndex((it) => it.name === compName);
  if (index >= 0) {
    newComps.splice(index, 1);
  } else {
    console.error('JoyDevConfiguration cannot find the configuration of  "configConfiguration" and remove it');
  }
});
Reflect.defineMetadata(METADATA.PROVIDERS, newComps, JoyDevConfiguration.prototype);
