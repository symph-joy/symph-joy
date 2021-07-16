import { ClassProvider, Tap } from "@symph/core";
import { getJsonSchema, JsonSchema } from "@tsed/schema";
import { getConfigMetadata } from "./config-value.decorator";
import Ajv from "ajv";
import { PROP_KEY_JOY_CONFIG_SET_VALUE } from "./constants";

class EmptySchemaClass {}

export function Configurable(
  options: Partial<ClassProvider> = {}
): ClassDecorator {
  return (target) => {
    const configMetas = getConfigMetadata(target);
    const propKeys: string[] = new Array(configMetas.length);
    const configKeys: string[] = new Array(configMetas.length);
    const configJsonSchema: JsonSchema = new JsonSchema(
      getJsonSchema(EmptySchemaClass)
    );
    for (let i = 0; i < configMetas.length; i++) {
      const { configKey, propKey, schema } = configMetas[i];
      propKeys[i] = propKey;
      configKeys[i] = configKey;
      configJsonSchema.addProperty(configKey, new JsonSchema(schema));
    }

    // 注册到全局的config schema中
    const validSchemaPropKey = `__joy_config_schema`;
    function addSchema(schema: JsonSchema): any {
      schema.assign(configJsonSchema);
    }
    target.prototype[validSchemaPropKey] = addSchema;
    Tap({ hookId: "addJoyConfigSchema" })(target, validSchemaPropKey);

    // 注册config的值变化
    const onConfigChangedPropKey = `__joy_config_changed`;

    const ajv = new Ajv();
    function setConfigValue(configInstance: any): any {
      // @ts-ignore
      const instance = this as any;
      const isValid = ajv.validate(configJsonSchema.toObject(), configInstance);
      if (!isValid) {
        const errMsg = ajv.errorsText(ajv.errors);
        throw new Error(errMsg);
      }

      if (instance.setConfigValue) {
        instance.setConfigValue(configInstance, configKeys);
        return;
      }

      for (let i = 0; i < propKeys.length; i++) {
        instance[propKeys[i]] = configInstance[configKeys[i]];
      }
    }

    function onConfigChanged(configInstance: any): any {
      // @ts-ignore
      const instance = this as any;
      // 执行用户自定义的赋值行为
      if (instance.onConfigChanged) {
        instance.onConfigChanged(configInstance, configKeys);
        return;
      }
      instance[PROP_KEY_JOY_CONFIG_SET_VALUE](configInstance);
    }
    target.prototype[PROP_KEY_JOY_CONFIG_SET_VALUE] = setConfigValue;
    target.prototype[onConfigChangedPropKey] = onConfigChanged;
    Tap({ hookId: "onJoyConfigChanged" })(target, onConfigChangedPropKey);
  };
}
