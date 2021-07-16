import {
  CorsOptions,
  CorsOptionsDelegate,
} from "./external/cors-options.interface";
import { HttpsOptions } from "./external/https-options.interface";
import { NestApplicationContextOptions } from "./nest-application-context-options.interface";
import { AbstractHttpAdapter } from "../adapters";
import { LoggerService, LogLevel } from "@symph/core";

/**
 * @publicApi
 */
export interface NestApplicationOptions extends NestApplicationContextOptions {
  // /**
  //  * CORS options from [CORS package](https://github.com/expressjs/cors#configuration-options)
  //  */
  // cors?: boolean | CorsOptions | CorsOptionsDelegate<any>;
  // /**
  //  * Whether to use underlying platform body parser.
  //  */
  // bodyParser?: boolean;
  // /**
  //  * Set of configurable HTTPS options
  //  */
  // httpsOptions?: HttpsOptions;

  /**
   * config file path or dir, default is current work dir.
   */
  configPath?: string;

  httpServer?: AbstractHttpAdapter;
  logger?: LoggerService | LogLevel[] | boolean;

  [configKey: string]: any;
}
