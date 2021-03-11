import { Abstract } from "../abstract.interface";
import { Scope } from "./scope-options.interface";
import { Type } from "../type.interface";

/**
 * Injection token type
 */
export type ProviderToken = string | Type<any> | Abstract<any>;

/**
 *
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
   * where or not auto register into container, when load the class。
   * default is false
   */
  autoReg?: boolean;
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
  useFactory: (...args: any[]) => T;
  /**
   * Optional list of providers to be injected into the context of the Factory function.
   */
  inject?: Array<Type<any> | string>;
  /**
   * Optional enum defining lifetime of the provider that is returned by the Factory function.
   */
  scope?: Scope;
}
