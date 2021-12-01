import { getJsonSchema, JsonSchema, Property } from "@tsed/schema";
import { Autowire, Type } from "@symph/core";
import { ConfigService } from "./config.service";

const REFLECT_KEY_CONFIG = "__joy_config_item";

export interface IConfigValueMeta {
  propKey: string;
  configKey: string;
  // schema?: T extends any ? any : JSONSchemaType<T, true>, // 为空表示不需要校验
  schema: JsonSchema | undefined; // 为空表示不需要校验
  onChange: "reload" | "regenerateTmpFiles";
  default: unknown; //default value
  transform?: (originalValue: unknown) => unknown;
}

let cacheHashId = 1;

const JoyConfigProp = Symbol("__joy_config_service");

/**
 * 声明一个配置项，当实例在初始化时，绑定joyConfig中的值到当前provider中
 * @param options
 * @constructor
 */
export function Value(options: Partial<Omit<IConfigValueMeta, "propKey">> = {}): PropertyDecorator {
  return (target, propKey) => {
    if (typeof propKey === "symbol") {
      throw new Error(`${target}, @ConfigValue() decorate property(${propKey.toString()}) should only to be string\'`);
    }
    Property()(target, propKey);
    const classSchema = getJsonSchema(target.constructor as any, { _cacheHash: cacheHashId++ }); // _cacheHash is used for prevent from cache.
    const curConfigSchema = plainJsonSchema(classSchema.definitions, classSchema.properties[propKey]);

    const configKey = options?.configKey || propKey;
    let existConfigs: IConfigValueMeta[];
    let ownConfigs = getConfigValuesMetadata(target, true);
    if (ownConfigs === undefined) {
      const superConfigs = getConfigValuesMetadata(target);
      existConfigs = superConfigs ? [...superConfigs] : [];
    } else {
      existConfigs = ownConfigs;
    }

    const configValueMeta = Object.assign(
      {
        propKey,
        configKey,
        onChange: "reload",
        // 如果是空的object，则在赋值的时候不校验。
        schema: curConfigSchema?.type === "object" && !curConfigSchema.properties ? undefined : curConfigSchema,
        default: undefined,
      } as IConfigValueMeta,
      options
    );
    const existOneIndex = existConfigs.findIndex((it) => it.propKey === propKey);
    if (existOneIndex >= 0) {
      existConfigs[existOneIndex] = configValueMeta;
    } else {
      existConfigs.push(configValueMeta);
    }

    // 声明一个隐藏的私有依赖属性，确保在ConfigService实例化后，才实例化被装饰的类。
    Autowire(ConfigService)(target, JoyConfigProp);
    Reflect.defineMetadata(REFLECT_KEY_CONFIG, existConfigs, target);
  };
}

/**
 *
 * @param definitions jsonSchema中的definitions字段
 * @param ref  reg: #/definitions/RouterConfig
 */
function getDefinition(definitions: any, ref: string): any {
  const refPaths = ref.split("/").slice(2);

  let curObj = definitions;
  refPaths.forEach((path) => {
    curObj = curObj[path];
  });
  return plainJsonSchema(definitions, curObj);
}

function plainJsonSchema(definitions: any, schema: any): any {
  if (schema.$ref) {
    return getDefinition(definitions, schema.$ref);
  } else if (schema.type === "array") {
    if (schema.items?.$ref) {
      schema.items = getDefinition(definitions, schema.items.$ref);
    } else if (Array.isArray(schema.items)) {
      for (let i = 0; i < schema.items; i++) {
        schema.items[i] = getJsonSchema(definitions, schema.items[i]);
      }
    }
  } else if (schema.type === "object" && schema.properties) {
    for (const prop of Object.keys(schema.properties)) {
      if (!schema.properties.hasOwnProperty(prop)) {
        continue;
      }
      schema.properties[prop] = plainJsonSchema(definitions, schema.properties[prop]);
    }
  }

  return schema;
}

export function getConfigValuesMetadata(targetType: Object | Type, isOwn = false): IConfigValueMeta[] | undefined {
  if (isOwn) {
    return Reflect.getOwnMetadata(REFLECT_KEY_CONFIG, typeof targetType === "function" ? targetType.prototype : targetType) as IConfigValueMeta[];
  }
  return Reflect.getMetadata(REFLECT_KEY_CONFIG, typeof targetType === "function" ? targetType.prototype : targetType) as IConfigValueMeta[];
}
