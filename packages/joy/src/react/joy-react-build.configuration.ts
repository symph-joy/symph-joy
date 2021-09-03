import { Configuration } from "@symph/core";
import { ReactRouter } from "@symph/react";
import { ReactContextFactory } from "./react-context-factory";
import { JoyReactConfig } from "./joy-react-config";
import { JoyReactRouterPlugin } from "./router/joy-react-router-plugin";
import { JoyReactConfiguration } from "./joy-react.configuration";
import { JoyBuildDevConfiguration } from "../build/joy-build-dev.configuration";
import { JoyBuildConfiguration } from "../build/joy-build.configuration";

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
