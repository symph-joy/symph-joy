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

  getProviderDefinition<TInput = any>(typeOrName: TypeOrTokenType<TInput>, packageName?: string): ComponentWrapper<TInput> | undefined;

  registerModule(module: EntryType | EntryType[]): ComponentWrapper[];

  loadModule(module: EntryType | EntryType[]): Promise<ComponentWrapper[]>;

  /**
   * 获取组件值
   * @param typeOrName 组件类型或名称
   */
  get<TInput = any>(typeOrName: TypeOrTokenType<TInput>): Promise<TInput> | TInput;

  /**
   * 获取组件值，如果组件不存在，返回null。
   * @param typeOrName 组件类型或名称
   */
  getOptional<TInput = any>(typeOrName: TypeOrTokenType<TInput>): Promise<TInput> | TInput | undefined;

  /**
   * 同步获取组件值，如果组件是异步组件，将会抛出异常。
   *  @param typeOrName 组件类型或名称
   */
  getSync<TInput = any>(typeOrName: TypeOrTokenType<TInput>): TInput;

  /**
   * 同步获取组件值，如果组件不存在，返回null，如果组件是异步组件，将会抛出异常。
   * @param typeOrName 组件类型或名称
   */
  getOptionalSync<TInput = any>(typeOrName: TypeOrTokenType<TInput>): TInput | undefined;

  /**
   * inject properties for instance
   */
  resolveProperties<TInstance>(instance: TInstance, typeOfInstance: Type<unknown>): ThenableResult<IInjectableDependency[]>;

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
