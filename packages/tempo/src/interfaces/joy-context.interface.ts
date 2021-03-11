import { LoggerService } from "../services/logger.service";
import { Abstract } from "./abstract.interface";
import { Type } from "./type.interface";
import { ThenableResult } from "../utils/task-thenable";
import { Dependency } from "./dependency.interface";

export type EntryType = Record<string, unknown> | Type<unknown>;
export type TypeOrTokenType<T> = Type<T> | Abstract<T> | string;

/**
 * Interface defining JoyApplicationContext.
 *
 * @publicApi
 */
export interface IJoyContext {
  get<TInput = unknown, TResult = TInput>(
    typeOrToken: TypeOrTokenType<TInput>,
    options?: { strict?: boolean; optional?: boolean }
  ): Promise<TResult> | TResult;

  syncGetProvider<TInput = unknown, TResult = TInput>(
    typeOrToken: TypeOrTokenType<TInput>,
    options?: { strict?: boolean; optional?: boolean }
  ): TResult;

  /**
   * inject properties for instance
   */
  resolveProperties<TInstance>(
    instance: TInstance,
    typeOrToken: TypeOrTokenType<unknown>
  ): ThenableResult<Dependency[]>;

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
