import { DOMElement, ReactElement } from "react";
import { ComponentWrapper, EntryType, IApplicationContext, TComponent } from "@symph/core";
import { TReactAppComponent } from "../react-app-component";
import { MountModule } from "../mount/mount-module";

/**
 * Interface defining the core Joy ReactApplication object.
 *
 * @publicApi
 */
export interface IReactApplication extends IApplicationContext {
  start(rootComponent?: TReactAppComponent): ReactElement;
  start(rootComponent: TReactAppComponent, domContainer?: DOMElement<any, any> | string): ReactElement;

  dispatch(action: any): Promise<any> | null | undefined;

  getState(): any;

  registerModule(module: EntryType | TComponent | MountModule | (EntryType | MountModule | TComponent)[]): ComponentWrapper[];

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
