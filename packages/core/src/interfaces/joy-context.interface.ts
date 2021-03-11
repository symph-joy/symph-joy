import { LoggerService } from "../services/logger.service";
import { Abstract } from "./abstract.interface";
import { Type } from "./type.interface";
import { ThenableResult } from "../utils/task-thenable";
import { IInjectableDependency } from "./injectable-dependency.interface";
import { InstanceWrapper } from "../injector";

export type EntryType = Record<string, unknown> | Type<unknown>;
export type TypeOrTokenType<T = any> = Type<T> | Abstract<T> | string;

/**
 * Interface defining JoyApplicationContext.
 *
 * @publicApi
 */
export interface IJoyContext {
  getProviderDefinition<TInput = any>(
    typeOrToken: TypeOrTokenType<TInput>
  ): InstanceWrapper<TInput> | undefined;

  /**
   * scan provider from module
   * @param module
   */
  loadModule(module: EntryType): Promise<void>;

  get<TInput = any>(
    typeOrToken: TypeOrTokenType<TInput>,
    options?: { strict?: boolean; optional?: boolean }
  ): Promise<TInput> | TInput | undefined;

  syncGetProvider<TInput = any>(
    typeOrToken: TypeOrTokenType<TInput>,
    options?: { strict?: boolean; optional?: boolean }
  ): TInput | undefined;

  /**
   * inject properties for instance
   */
  resolveProperties<TInstance>(
    instance: TInstance,
    typeOrToken: TypeOrTokenType<unknown>
  ): ThenableResult<IInjectableDependency[]>;

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
