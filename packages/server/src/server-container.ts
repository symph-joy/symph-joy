import {
  ContextId,
  InstanceBy,
  InstanceWrapper,
  JoyContainer,
} from "@symph/core";
import { REQUEST } from "./router";
import { HttpServer } from "./interfaces/http";
import { Controller } from "./interfaces/controllers";
import { CONTROLLER_METADATA } from "./constants";
import { AbstractHttpAdapter } from "./adapters";
import { ApplicationConfig } from "./application-config";

export class ServerContainer extends JoyContainer {
  private _httpAdapter: HttpServer;
  public applicationConfig: ApplicationConfig;

  get controllers(): Map<string, InstanceWrapper<Controller>> {
    return this.filter((id, wrapper) => {
      if (wrapper && wrapper.instanceBy === "class") {
        return Reflect.getMetadata(CONTROLLER_METADATA, wrapper.useClass!);
      }
      return false;
    });
  }

  public registerRequestProvider<T = any>(request: T, contextId: ContextId) {
    const wrapper = this.getProvider(REQUEST)!;
    wrapper.setInstanceByContextId(contextId, {
      instance: request,
      isResolved: true,
      id: wrapper.id, // todo remove id property
    });
  }

  public setHttpAdapter(httpAdapter: HttpServer): void {
    // this.internalProvidersStorage.httpAdapter = httpAdapter;
    //
    // if (!this.internalProvidersStorage.httpAdapterHost) {
    //   return;
    // }
    // const host = this.internalProvidersStorage.httpAdapterHost;
    this._httpAdapter = httpAdapter;
  }

  public getHttpAdapterRef(): HttpServer {
    return this._httpAdapter;
  }
}
