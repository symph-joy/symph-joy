import { Abstract } from "../abstract.interface";
import { Scope } from "./scope-options.interface";
import { Type } from "../type.interface";
import { InjectCustomOptionsInterface } from "../inject-custom-options.interface";

/**
 * Injection token type
 */
export type ProviderToken = string | Type<any> | Abstract<any>;

/**
 * todo rename to ProviderDefinition
 * @publicApi
 */
export type Provider<T = any> =
  | IProvider // deprecated
  | ClassProvider<T>
  | ValueProvider<T>
  | FactoryProvider<T>;

export interface IProvider<T = any> {
  /**
   * provider name
   */
  id: string;

  /**
   * provider class
   */
  type: Type<T>;
}

/**
 * Interface defining a *Class* type provider.
 *
 * For example:
 * ```typescript
 * const configServiceProvider = {
 * provide: ConfigService,
 * useClass:
 *   process.env.NODE_ENV === 'development'
 *     ? DevelopmentConfigService
 *     : ProductionConfigService,
 * };
 * ```
 *
 *
 * @publicApi
 */
export interface ClassProvider<T = any> extends IProvider<T> {
  /**
   * Type (class name) of provider (instance to be injected).
   */
  useClass: Type<T>;
  /**
   * Optional enum defining lifetime of the provider that is injected.
   */
  scope?: Scope;

  /**
   * whether auto register into container,
   * ture: scan file system, and register to container.
   * lazy: during app running, auto register to container and instance.
   * false: do noting. register and instance should by developer.
   * default is true
   */
  autoLoad?: boolean | "lazy";
}

/**
 * Interface defining a *Value* type provider.
 *
 * For example:
 * ```typescript
 * const connectionProvider = {
 *   provide: 'CONNECTION',
 *   useValue: connection,
 * };
 * ```
 *
 * @publicApi
 */
export interface ValueProvider<T = any> extends IProvider<T> {
  /**
   * Instance of a provider to be injected.
   */
  useValue: T;
}

/**
 * Interface defining a *Factory* type provider.
 *
 * For example:
 * ```typescript
 * const connectionFactory = {
 *   provide: 'CONNECTION',
 *   useFactory: (optionsProvider: OptionsProvider) => {
 *     const options = optionsProvider.get();
 *     return new DatabaseConnection(options);
 *   },
 *   inject: [OptionsProvider],
 * };
 * ```
 *
 * @publicApi
 */
export interface FactoryProvider<T = any> extends IProvider<T> {
  /**
   * Factory function that returns an instance of the provider to be injected.
   */
  useFactory: (...args: any[]) => T | { factory: Type; property: string };
  /**
   * Optional list of providers to be injected into the context of the Factory function.
   */
  inject?: Array<Type<any> | string | InjectCustomOptionsInterface>;
  /**
   * Optional enum defining lifetime of the provider that is returned by the Factory function.
   */
  scope?: Scope;
}

export function isProvider(
  provider: Provider
): provider is ClassProvider | FactoryProvider | ValueProvider {
  const { id, useClass, useValue, useFactory } = provider as any;
  return (
    typeof id != "undefined" &&
    (typeof useClass !== "undefined" ||
      typeof useValue !== "undefined" ||
      typeof useFactory !== "undefined")
  );
}

export function isClassProvider(provider: any): provider is ClassProvider {
  return typeof (provider as ClassProvider).useClass !== "undefined";
}

export function isValueProvider(provider: any): provider is ValueProvider {
  return typeof (provider as ValueProvider).useValue !== "undefined";
}

export function isFactoryProvider(provider: any): provider is FactoryProvider {
  return typeof (provider as FactoryProvider).useFactory !== "undefined";
}
