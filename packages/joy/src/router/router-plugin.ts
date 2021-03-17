import { JoyAppConfig } from "../next-server/server/joy-config/joy-app-config";
import { CollectionOf, MinLength } from "@tsed/schema";
import { ConfigValue } from "../next-server/server/joy-config/config-value.decorator";
import { IJoyPlugin } from "../plugin/joy-plugin.interface";
import { JoyPlugin } from "../plugin/joy-plugin.decorator";
// import {ReactRouteInterface} from "../router/react-route.interface";

// export function ConfigValue<T extends any>(configOptions?: Partial<IJoyConfigMeta<T>>): PropertyDecorator {
//   return (target, propertyKey) => {
//     // const validSchemaPropKey = `__joy_config_schema_${propertyKey as string}`
//     // function addSchema(): any{
//     //   return configOptions?.schema || {'schemaTest': 'aaaaaaa'}
//     // }
//     // target.constructor.prototype[validSchemaPropKey] = addSchema
//     //
//     // // 注册tap，添加到全局的config schema中
//     // Tap( {hookId: 'addConfigSchema'})(target, validSchemaPropKey)
//
//     // 声明一个配置项，当实例在初始化是，绑定joyConfig中的值到当前provider中
//     const configMeta: IJoyConfigMeta<T> = Object.assign({
//       key: propertyKey as string,
//       onChange:  'reload',
//       schema: undefined
//     }, configOptions)
//
//     const existConfigs = getConfigMetadata(target) || []
//     existConfigs.push(configMeta)
//
//     Reflect.defineMetadata(REFLECT_KEY_CONFIG, existConfigs, target)
//   };
// }

class RouteConfig {
  @MinLength(3)
  public path: string;
}

@JoyPlugin()
export class RouterPlugin implements IJoyPlugin {
  name = "router-plugin";
  version = "v1.0.0";

  constructor(private config: JoyAppConfig) {}

  @ConfigValue({ configKey: "routes", onChange: "reload" })
  @CollectionOf(RouteConfig)
  public routesConfig: RouteConfig[];

  // onConfigChange(config: JoyAppConfig, configKeys: string[]): JoyAppConfig {
  //   return config
  // }

  // @ConfigValue()
  // // @MaxLength(5)
  // private path: string

  // @Tap()
  // private async afterModuleLoadHook(moduleLoaded: any) {
  //   console.log('>>>> RouterPlugin. afterModuleLoad', moduleLoaded)
  // }
}
