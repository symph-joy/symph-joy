import { ClassComponent, FactoryComponent, TComponent, ComponentName, ValueComponent } from "../../../interfaces/context/component.interface";
import { isNil, isUndefined } from "../../../utils/shared.utils";
import { METADATA } from "../../../constants";
import { Scope } from "../../../interfaces";
import { CUSTOM_INJECT_FUNC_PARAM_META } from "../inject.decorator";
import { InjectCustomOptionsInterface } from "../../../interfaces/inject-custom-options.interface";

/**
 * Defines the injection scope.
 *
 * @publicApi
 */
export type ProviderOptions = {
  /**
   * provider name
   */
  name?: ComponentName;

  /**
   * Optional enum defining lifetime of the provider that is injected.
   */
  scope?: Scope;

  /**
   * 如果为false，只有通过明确的包名，才能找到该Component.
   * 依赖注入时，只指定了被依赖的组件名称，只有在同一个包名下，或者全局公开同名的组件，才能被注入。
   */
  global?: boolean;

  /**
   * alias array
   */
  alias?: ComponentName[];
};

export function Component(options: ProviderOptions = {}): PropertyDecorator {
  return (target, propertyKey) => {
    const propType = Reflect.getMetadata("design:type", target, propertyKey);
    const paramTypes = Reflect.getMetadata("design:paramtypes", target, propertyKey);
    const returnType = Reflect.getMetadata("design:returntype", target, propertyKey);

    let provider: TComponent;
    if (!isUndefined(paramTypes)) {
      // FactoryProvider
      const inject = [...paramTypes];
      // 设置自定义注入的参数
      const customParams = Reflect.getMetadata(CUSTOM_INJECT_FUNC_PARAM_META, target, propertyKey) as Map<number, InjectCustomOptionsInterface>;
      if (customParams && customParams.size > 0) {
        customParams.forEach((customInject, index) => {
          let { type, name, isOptional } = customInject;
          if (type === undefined && name === undefined) {
            type = inject[index];
          }
          inject[index] = {
            type,
            name,
            isOptional,
          } as InjectCustomOptionsInterface;
        });
      }
      provider = Object.assign(
        {
          name: propertyKey,
          type: returnType,
          // useFactory: target[propertyKey],
          useFactory: { factory: target.constructor, property: propertyKey },
          inject,
          scope: Scope.SINGLETON,
        },
        options
      ) as FactoryComponent;
    } else {
      if (isCustomValueComponent(options)) {
        //ValueComponent
        provider = Object.assign(
          {
            name: propertyKey,
            type: propType,
            useValue: options.useValue,
            scope: Scope.SINGLETON,
          },
          options
        ) as ValueComponent;
      } else {
        //ClassProvider
        provider = Object.assign(
          {
            name: propertyKey,
            type: propType,
            useClass: propType,
            scope: Scope.SINGLETON,
          },
          options
        ) as ClassComponent;
      }
    }

    let providers: TComponent[] = Reflect.getOwnMetadata(METADATA.PROVIDERS, target);
    if (isNil(providers)) {
      // 尝试重父类获取
      providers = [...(Reflect.getMetadata(METADATA.PROVIDERS, target) || [])];
    }

    // 如果已经存在，覆盖之前定义的，可能来至父类
    const existIndex = providers.findIndex((value) => value.name === provider.name);
    if (existIndex >= 0) {
      providers[existIndex] = provider;
    } else {
      providers.push(provider);
    }
    Reflect.defineMetadata(METADATA.PROVIDERS, providers, target);
  };
}

export function getConfigurationComponents(configClazz: any): TComponent[] {
  return Reflect.getMetadata(METADATA.PROVIDERS, configClazz.prototype) as TComponent[];
}

export function isCustomValueComponent(provider: any): provider is ValueComponent {
  return provider && !isUndefined((provider as ValueComponent).useValue);
}
