import { Configuration } from "@symph/core";
import { JoyReactConfiguration } from "./joy-react.configuration";

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
