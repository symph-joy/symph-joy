import { PROPERTY_DEPS_METADATA, SELF_DECLARED_DEPS_METADATA } from "../../constants";
import { isFunction } from "../../utils/shared.utils";
import { componentNameGenerate } from "../../injector/component-name-generate";
import { IInjectableDependency, EnuInjectBy } from "../../interfaces/injectable-dependency.interface";
import { Type } from "../../interfaces";
import { InjectCustomOptionsInterface } from "../../interfaces/inject-custom-options.interface";

/**
 * Decorator that marks a constructor parameter as a target for
 *
 * Any injected provider must be visible within the context scope
 * of the class it is being injected into.
 *
 * #### Injection tokens
 * Can be *types* (class names), *strings*. This depends on how the
 * provider with which it is associated was defined. Providers defined with the
 * `@Injectable()` decorator use the class name. Custom Providers may use strings
 * or as the injection id.
 *
 * @param typeOrName lookup key for the provider to be injected (assigned to the constructor
 * parameter).
 *
 * @publicApi
 */
export function Inject(typeOrName?: string | symbol | Type) {
  let providerName: string | symbol;
  let providerType: Type;
  if (isFunction(typeOrName)) {
    providerType = typeOrName as Type;
  } else {
    providerName = typeOrName as string | symbol;
  }

  return (target: Object, key: string | symbol, index?: number) => {
    if (key === undefined) {
      injectConstructor(target, index as number, providerName, providerType);
      return;
    } else {
      if (typeof index === "number") {
        injectPropertyFuncParam(target, key, index, providerName, providerType);
      } else {
        injectProperty(target, key, providerName, providerType);
      }
    }
  };
}

export const CUSTOM_INJECT_FUNC_PARAM_META = "__CUSTOM_INJECT_FUNC_PARAM";

function injectPropertyFuncParam(target: Object, key: string | symbol, index: number, providerName: string | symbol, providerType: Type) {
  const params: Map<number, InjectCustomOptionsInterface> = Reflect.getMetadata(CUSTOM_INJECT_FUNC_PARAM_META, target, key) || new Map();
  const param = providerName
    ? {
        name: providerName,
      }
    : {
        type: providerType,
      };
  params.set(index, param);
  Reflect.defineMetadata(CUSTOM_INJECT_FUNC_PARAM_META, params, target, key);
}

function injectProperty(target: Object, key: string | symbol, providerName: string | symbol, providerType: Type) {
  let injectBy = EnuInjectBy.TYPE_NAME;
  const designType = Reflect.getMetadata("design:type", target, key);
  if (!providerType) {
    providerType = designType;
  } else {
    injectBy = EnuInjectBy.TYPE;
  }
  if (!providerName) {
    providerName = key;
  } else {
    injectBy = EnuInjectBy.NAME;
  }

  let properties: IInjectableDependency[] = Reflect.getMetadata(PROPERTY_DEPS_METADATA, target.constructor) || [];
  properties = [...properties, { key, designType, name: providerName, type: providerType, injectBy }];
  Reflect.defineMetadata(PROPERTY_DEPS_METADATA, properties, target.constructor);
}

function injectConstructor(target: Object, index: number, providerName: string | symbol, providerType: Type): void {
  let injectBy = EnuInjectBy.TYPE;
  const paramTypes = Reflect.getMetadata("design:paramtypes", target);
  const designType = paramTypes[index];
  if (providerType) {
    injectBy = EnuInjectBy.TYPE;
  } else {
    providerType = designType;
  }
  if (providerName) {
    injectBy = EnuInjectBy.NAME;
  } else {
    providerName = componentNameGenerate(providerType);
  }
  let dependencies: IInjectableDependency[] = Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target) || [];
  dependencies = [...dependencies, { index, designType, name: providerName, type: providerType, injectBy }];
  Reflect.defineMetadata(SELF_DECLARED_DEPS_METADATA, dependencies, target);
}
