import { Abstract } from "../abstract.interface";
import { Scope } from "./scope-options.interface";
import { Type } from "../type.interface";
import { InjectCustomOptionsInterface } from "../inject-custom-options.interface";

export type ComponentName = string | symbol;

/**
 * Injection token type
 */
export type ProviderToken = ComponentName | Type<any> | Abstract<any>;

/**
 * todo rename to ProviderDefinition
 * @publicApi
 */
export type TComponent<T = any> =
  | IComponent // deprecated
  | ClassComponent<T>
  | ValueComponent<T>
  | FactoryComponent<T>;

export interface IComponent<T = any> {
  /**
   * provider name
   */
  name: ComponentName;

  /**
   * in which package domain
   */
  package?: string;

  global?: boolean; // 如果为false，只有通过明确的包名，才能找到该Component，无法通过匿名包名或全局找到。

  /**
   * alias array
   */
  alias?: ComponentName[];

  /**
   * provider class
   */
  type: Type<T> | Abstract<T>;
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
export interface ClassComponent<T = any> extends IComponent<T> {
  /**
   * Type (class name) of provider (instance to be injected).
   */
  useClass: Function | Type;
  /**
   * Optional enum defining lifetime of the provider that is injected.
   */
  scope?: Scope;

  /**
   * whether auto register into container,
   */
  lazyRegister?: boolean;
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
export interface ValueComponent<T = any> extends IComponent<T> {
  /**
   * Instance of a component to be injected.
   */
  useValue: T;
}

/**
 * Interface defining a *Factory* type component.
 *
 * For example:
 * ```typescript
 * const connectionFactory = {
 *   provide: 'CONNECTION',
 *   useFactory: (optionsComponent: OptionsComponent) => {
 *     const options = optionsComponent.get();
 *     return new DatabaseConnection(options);
 *   },
 *   inject: [OptionsComponent],
 * };
 * ```
 *
 * @publicApi
 */
export interface FactoryComponent<T = any> extends IComponent<T> {
  /**
   * Factory function that returns an instance of the provider to be injected.
   */
  useFactory: ((...args: any[]) => T) | { factory: Type; property: string };
  /**
   * Optional list of providers to be injected into the context of the Factory function.
   */
  inject?: Array<Type<any> | string | InjectCustomOptionsInterface>;
  /**
   * Optional enum defining lifetime of the provider that is returned by the Factory function.
   */
  scope?: Scope;
}

export function isComponent(provider: TComponent): provider is ClassComponent | FactoryComponent | ValueComponent {
  const { id, useClass, useValue, useFactory } = provider as any;
  return typeof id != "undefined" && (typeof useClass !== "undefined" || typeof useValue !== "undefined" || typeof useFactory !== "undefined");
}

export function isClassComponent(provider: any): provider is ClassComponent {
  return typeof (provider as ClassComponent).useClass !== "undefined";
}

export function isValueComponent(provider: any): provider is ValueComponent {
  return typeof (provider as ValueComponent).useValue !== "undefined";
}

export function isFactoryComponent(provider: any): provider is FactoryComponent {
  return typeof (provider as FactoryComponent).useFactory !== "undefined";
}
