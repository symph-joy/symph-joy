import { IJoyContext } from "../../interfaces/joy-context.interface";
import { ComponentType } from "react";

/**
 * Interface defining the core Joy ReactApplication object.
 *
 * @publicApi
 */
export interface IReactApplication extends IJoyContext {
  start(): ComponentType;

  dispatch(action: any): Promise<any> | null | undefined;

  getState(): any;

  /**
   * Registers a prefix for every HTTP route path.
   *
   * @param  {string} prefix The prefix for every HTTP route path (for example `/v1/api`)
   * @returns {void}
   */
  setGlobalPrefix(prefix: string): this;

  /**
   * Terminates the application (including JoyApplication, Gateways, and each connected
   * microservice)
   *
   * @returns {Promise<void>}
   */
  close(): Promise<void>;
}
