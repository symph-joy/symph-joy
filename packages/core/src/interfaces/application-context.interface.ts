import { LoggerService } from "../services/logger.service";
import { Abstract } from "./abstract.interface";
import { Type } from "./type.interface";
import { ThenableResult } from "../utils/task-thenable";
import { IInjectableDependency } from "./injectable-dependency.interface";
import { ComponentWrapper, ApplicationContainer, Injector } from "../injector";
import { ComponentName } from "./context/component.interface";

export type EntryType = Record<string, unknown> | Type<unknown>;
export type TypeOrTokenType<T = any> = Type<T> | Abstract<T> | ComponentName;

/**
 * Interface defining JoyApplicationContext.
 *
 * @publicApi
 */
export interface IApplicationContext {
  readonly container: ApplicationContainer;
  readonly injector: Injector;

  readonly parent?: IApplicationContext;

  getProviderDefinition<TInput = any>(typeOrToken: TypeOrTokenType<TInput>, packageName?: string): ComponentWrapper<TInput> | undefined;

  registerModule(module: EntryType | EntryType[]): ComponentWrapper[];

  loadModule(module: EntryType | EntryType[]): Promise<ComponentWrapper[]>;

  get<TInput = any>(typeOrToken: TypeOrTokenType<TInput>, options?: { strict?: boolean }): Promise<TInput> | TInput;

  getOptional<TInput = any>(typeOrToken: TypeOrTokenType<TInput>, options?: { strict?: boolean }): Promise<TInput> | TInput | undefined;

  getSync<TInput = any>(typeOrToken: TypeOrTokenType<TInput>, options?: { strict?: boolean }): TInput;

  getOptionalSync<TInput = any>(typeOrToken: TypeOrTokenType<TInput>, options?: { strict?: boolean }): TInput | undefined;

  /**
   * inject properties for instance
   */
  resolveProperties<TInstance>(instance: TInstance, typeOrToken: TypeOrTokenType<unknown>): ThenableResult<IInjectableDependency[]>;

  /**
   * Initialize the application.
   * Calls the Joy lifecycle events.
   * It isn't mandatory to call this method directly.
   *
   * @returns {Promise<this>} The ApplicationContext instance as Promise
   */
  init(): Promise<this>;

  /**
   * Terminates the application
   * @returns {Promise<void>}
   */
  close(): Promise<void>;

  /**
   * Sets custom logger service
   * @returns {void}
   */
  useLogger(logger: LoggerService): void;
}
