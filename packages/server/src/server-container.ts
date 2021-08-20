import { ContextId, CoreContainer, InstanceWrapper } from "@symph/core";
import { REQUEST } from "./router";
import { HttpServer } from "./interfaces/http";
import { Controller } from "./interfaces/controllers";
import { CONTROLLER_METADATA } from "./constants";
import { ApplicationConfig } from "./application-config";

export class ServerContainer extends CoreContainer {
  private _httpAdapter: HttpServer;
  public applicationConfig: ApplicationConfig;

  get controllers(): InstanceWrapper<Controller>[] {
    return this.filter((wrapper) => {
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
