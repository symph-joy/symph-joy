import { Configuration } from "@symph/core";
import { JoyReactConfiguration } from "./joy-react.configuration";

/**
 * 配置Joy中分析和编译React相关模块
 */
@Configuration()
export class JoyReactBuildConfiguration extends JoyReactConfiguration {
  // @Configuration.Component()
  // public joyBuildConfiguration: JoyBuildConfiguration;
  // @Configuration.Component()
  // public joyReactRouter: JoyReactRouterPlugin;
}
