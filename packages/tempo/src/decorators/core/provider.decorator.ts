import {
  ClassProvider,
  FactoryProvider,
  Provider as ProviderType,
  ValueProvider,
} from "../../interfaces/context/provider.interface";
import { isNil, isUndefined } from "../../utils/shared.utils";
import { METADATA } from "../../constants";
import { Scope } from "../../interfaces";

export function Provider(options?: Partial<ProviderType>): PropertyDecorator {
  return (target, propertyKey) => {
    const propType = Reflect.getMetadata("design:type", target, propertyKey);
    const paramTypes = Reflect.getMetadata(
      "design:paramtypes",
      target,
      propertyKey
    );
    const returnType = Reflect.getMetadata(
      "design:returntype",
      target,
      propertyKey
    );

    let provider: ProviderType = null;
    if (!isUndefined(paramTypes)) {
      // FactoryProvider
      provider = Object.assign(
        {
          id: propertyKey,
          type: returnType,
          useFactory: target[propertyKey],
          inject: paramTypes, // todo 支持@inject(), 自定义注入的参数
          scope: Scope.DEFAULT,
        },
        options
      ) as FactoryProvider;
    } else {
      if (isCustomValueProvider(options)) {
        //ValueProvider
        provider = Object.assign(
          {
            id: propertyKey,
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
            id: propertyKey,
            type: propType,
            useClass: propType,
            scope: Scope.DEFAULT,
          },
          options
        ) as ClassProvider;
      }
    }

    let providers: ProviderType[] = Reflect.getOwnMetadata(
      METADATA.PROVIDERS,
      target
    );
    if (isNil(providers)) {
      // 尝试重父类获取
      providers = [...(Reflect.getMetadata(METADATA.PROVIDERS, target) || [])];
    }

    // 如果已经存在，覆盖之前定义的，可能来至父类
    const existIndex = providers.findIndex((value) => value.id === provider.id);
    if (existIndex >= 0) {
      providers[existIndex] = provider;
    } else {
      providers.push(provider);
    }
    Reflect.defineMetadata(METADATA.PROVIDERS, providers, target);
  };
}

export function isCustomValueProvider(
  provider: any
): provider is ValueProvider {
  return provider && !isUndefined((provider as ValueProvider).useValue);
}
