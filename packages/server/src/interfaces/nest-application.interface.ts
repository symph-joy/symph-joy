import { CorsOptions, CorsOptionsDelegate } from "./external/cors-options.interface";
import { CanActivate } from "./features/can-activate.interface";
import { NestInterceptor } from "./features/nest-interceptor.interface";
import { HttpServer } from "./http/http-server.interface";
// import {
//   ExceptionFilter,
//   INestMicroservice,
//   NestHybridApplicationOptions,
//   PipeTransform,
// } from './index';
import { INestApplicationContext } from "./nest-application-context.interface";
import { WebSocketAdapter } from "./websockets/web-socket-adapter.interface";
import { INestMicroservice } from "./nest-microservice.interface";
import { NestHybridApplicationOptions } from "./microservices/nest-hybrid-application-options.interface";
import { ExceptionFilter } from "./exceptions";
import { PipeTransform } from "./features/pipe-transform.interface";
import { ShutdownSignal } from "../enums";
import { IApplicationContext } from "@symph/core";

/**
 * Interface defining the core NestApplication object.
 *
 * @publicApi
 */
export interface INestApplication extends IApplicationContext {
  /**
   * Registers the request/context object for a given context ID (DI container sub-tree).
   * @returns {void}
   */
  registerRequestByContextId<T = any>(request: T, contextId: { id: number }): void;

  /**
   * Enables the usage of shutdown hooks. Will call the
   * `onApplicationShutdown` function of a provider if the
   * process receives a shutdown signal.
   *
   * @returns {this} The Nest application context instance
   */
  enableShutdownHooks(signals?: ShutdownSignal[] | string[]): this;

  /**
   * A wrapper function around HTTP adapter method: `adapter.use()`.
   * Example `app.use(cors())`
   *
   * @returns {this}
   */
  use(...args: any[]): this;

  /**
   * Enables CORS (Cross-Origin Resource Sharing)
   *
   * @returns {void}
   */
  enableCors(options?: CorsOptions | CorsOptionsDelegate<any>): void;

  /**
   * Starts the application.
   *
   * @param {number|string} port
   * @param {string} [hostname]
   * @param {Function} [callback] Optional callback
   * @returns {Promise} A Promise that, when resolved, is a reference to the underlying HttpServer.
   */
  listen(port: number | string, callback?: () => void): Promise<any>;
  listen(port: number | string, hostname: string, callback?: () => void): Promise<any>;

  /**
   * Returns the url the application is listening at, based on OS and IP version. Returns as an IP value either in IPv6 or IPv4
   *
   * @returns {Promise<string>} The IP where the server is listening
   */
  getUrl(): Promise<string>;

  /**
   * Starts the application (can be awaited).
   *
   * @param {number|string} port
   * @param {string} [hostname]
   * @returns {Promise}
   */
  listenAsync(port: number | string, hostname?: string): Promise<any>;

  /**
   * Registers a prefix for every HTTP route path.
   *
   * @param {string} prefix The prefix for every HTTP route path (for example `/v1/api`)
   * @returns {this}
   */
  setGlobalPrefix(prefix: string): this;

  /**
   * Register Ws Adapter which will be used inside Gateways.
   * Use when you want to override default `socket.io` library.
   *
   * @param {WebSocketAdapter} adapter
   * @returns {this}
   */
  useWebSocketAdapter(adapter: WebSocketAdapter): this;

  /**
   * Connects microservice to the NestApplication instance. Transforms application
   * to a hybrid instance.
   *
   * @template {object} T
   * @param {T} options Microservice options object
   * @param {NestHybridApplicationOptions} hybridOptions Hybrid options object
   * @returns {INestMicroservice}
   */
  connectMicroservice<T extends object = any>(options: T, hybridOptions?: NestHybridApplicationOptions): INestMicroservice;

  /**
   * Returns array of the microservices connected to the NestApplication.
   *
   * @returns {INestMicroservice[]}
   */
  getMicroservices(): INestMicroservice[];

  /**
   * Returns the underlying native HTTP server.
   *
   * @returns {*}
   */
  getHttpServer(): any;

  /**
   * Returns the underlying HTTP adapter.
   *
   * @returns {HttpServer}
   */
  getHttpAdapter(): HttpServer;

  /**
   * Starts all connected microservices asynchronously.
   *
   * @param {Function} [callback] Optional callback function
   * @returns {this}
   */
  startAllMicroservices(callback?: () => void): this;

  /**
   * Starts all connected microservices and can be awaited.
   *
   * @returns {Promise}
   */
  startAllMicroservicesAsync(): Promise<void>;

  /**
   * Registers exception filters as global filters (will be used within
   * every HTTP route handler)
   *
   * @param {...ExceptionFilter} filters
   */
  useGlobalFilters(...filters: ExceptionFilter[]): this;

  /**
   * Registers pipes as global pipes (will be used within every HTTP route handler)
   *
   * @param {...PipeTransform} pipes
   */
  useGlobalPipes(...pipes: PipeTransform<any>[]): this;

  /**
   * Registers interceptors as global interceptors (will be used within
   * every HTTP route handler)
   *
   * @param {...NestInterceptor} interceptors
   */
  useGlobalInterceptors(...interceptors: NestInterceptor[]): this;

  /**
   * Registers guards as global guards (will be used within every HTTP route handler)
   *
   * @param {...CanActivate} guards
   */
  useGlobalGuards(...guards: CanActivate[]): this;

  /**
   * Terminates the application (including NestApplication, Gateways, and each connected
   * microservice)
   *
   * @returns {Promise<void>}
   */
  close(): Promise<void>;
}
