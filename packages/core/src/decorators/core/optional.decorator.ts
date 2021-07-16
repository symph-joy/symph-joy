import {
  OPTIONAL_DEPS_METADATA,
  OPTIONAL_PROPERTY_DEPS_METADATA,
} from "../../constants";
import { isUndefined } from "../../utils/shared.utils";
import { InjectCustomOptionsInterface } from "../../interfaces/inject-custom-options.interface";
import { CUSTOM_INJECT_FUNC_PARAM_META } from "./inject.decorator";

/**
 * Parameter decorator for an injected dependency marking the
 * dependency as optional.
 *
 * @publicApi
 */
export function Optional() {
  return (target: Object, key: string | symbol, index?: number) => {
    if (key === undefined) {
      const args = Reflect.getMetadata(OPTIONAL_DEPS_METADATA, target) || [];
      Reflect.defineMetadata(OPTIONAL_DEPS_METADATA, [...args, index], target);
      return;
    } else {
      if (typeof index === "number") {
        const params: Map<number, InjectCustomOptionsInterface> =
          Reflect.getMetadata(CUSTOM_INJECT_FUNC_PARAM_META, target, key) ||
          new Map();
        const param = params.get(index) || {};
        param.isOptional = true;
        params.set(index, param);
        Reflect.defineMetadata(
          CUSTOM_INJECT_FUNC_PARAM_META,
          params,
          target,
          key
        );
      } else {
        const properties =
          Reflect.getMetadata(
            OPTIONAL_PROPERTY_DEPS_METADATA,
            target.constructor
          ) || [];
        Reflect.defineMetadata(
          OPTIONAL_PROPERTY_DEPS_METADATA,
          [...properties, key],
          target.constructor
        );
      }
    }

    // if (!isUndefined(index)) {
    //   const args = Reflect.getMetadata(OPTIONAL_DEPS_METADATA, target) || [];
    //   Reflect.defineMetadata(OPTIONAL_DEPS_METADATA, [...args, index], target);
    //   return;
    // }
    // const properties =
    //   Reflect.getMetadata(
    //     OPTIONAL_PROPERTY_DEPS_METADATA,
    //     target.constructor
    //   ) || [];
    // Reflect.defineMetadata(
    //   OPTIONAL_PROPERTY_DEPS_METADATA,
    //   [...properties, key],
    //   target.constructor
    // );
  };
}
