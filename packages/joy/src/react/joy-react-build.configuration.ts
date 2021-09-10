import { Configuration } from "@symph/core";
import { ReactRouter } from "@symph/react";
import { ReactContextFactory } from "./react-context-factory";
import { JoyReactConfig } from "./joy-react-config";
import { JoyReactRouterPlugin } from "./router/joy-react-router-plugin";
import { JoyReactConfiguration } from "./joy-react.configuration";
import { BuildDevConfiguration } from "../build/build-dev.configuration";
import { BuildConfiguration } from "../build/build.configuration";

/**
 * 配置Joy中分析和编译React相关模块
 */
@Configuration()
export class JoyReactBuildConfiguration extends JoyReactConfiguration {
  // @Configuration.Provider()
  // public joyBuildConfiguration: JoyBuildConfiguration;
  // @Configuration.Provider()
  // public joyReactRouter: JoyReactRouterPlugin;
}
