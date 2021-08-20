import { ClassProvider, FactoryProvider, Provider as ProviderType, ValueProvider } from "../../../interfaces/context/provider.interface";
import { isNil, isUndefined } from "../../../utils/shared.utils";
import { METADATA } from "../../../constants";
import { Scope } from "../../../interfaces";
import { CUSTOM_INJECT_FUNC_PARAM_META } from "../autowire.decorator";
import { InjectCustomOptionsInterface } from "../../../interfaces/inject-custom-options.interface";

export function Provider(options?: Partial<ProviderType>): PropertyDecorator {
  return (target, propertyKey) => {
    const propType = Reflect.getMetadata("design:type", target, propertyKey);
    const paramTypes = Reflect.getMetadata("design:paramtypes", target, propertyKey);
    const returnType = Reflect.getMetadata("design:returntype", target, propertyKey);

    let provider: ProviderType;
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
          scope: Scope.DEFAULT,
        },
        options
      ) as FactoryProvider;
    } else {
      if (isCustomValueProvider(options)) {
        //ValueProvider
        provider = Object.assign(
          {
            name: propertyKey,
            type: propType,
            useValue: options.useValue,
            scope: Scope.DEFAULT,
          },
          options
        ) as ValueProvider;
      } else {
        //ClassProvider
        provider = Object.assign(
          {
            name: propertyKey,
            type: propType,
            useClass: propType,
            scope: Scope.DEFAULT,
          },
          options
        ) as ClassProvider;
      }
    }

    let providers: ProviderType[] = Reflect.getOwnMetadata(METADATA.PROVIDERS, target);
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

export function getConfigurationProviders(configClazz: any): ProviderType[] {
  return Reflect.getMetadata(METADATA.PROVIDERS, configClazz.prototype) as ProviderType[];
}

export function isCustomValueProvider(provider: any): provider is ValueProvider {
  return provider && !isUndefined((provider as ValueProvider).useValue);
}
