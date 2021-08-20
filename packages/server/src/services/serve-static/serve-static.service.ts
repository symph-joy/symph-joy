import { Component, ProviderLifecycle, Tap } from "@symph/core";
import { AbstractHttpAdapter } from "../../adapters";
import { ServeStaticOptions } from "./interfaces/serve-static-options.interface";
import { FastifyLoader } from "./loaders/fastify.loader";

@Component()
export class ServeStaticService {
  constructor(private httpAdapter: AbstractHttpAdapter, private optionsArr: ServeStaticOptions[], public loader: FastifyLoader) {}

  public registerServeStatic(option: ServeStaticOptions | ServeStaticOptions[]) {
    if (Array.isArray(option)) {
      this.optionsArr.push(...option);
    } else {
      this.optionsArr.push(option);
    }
  }

  @Tap()
  onContextInitialized() {
    return this.start();
  }

  protected register(staticConfig: ServeStaticOptions | ServeStaticOptions[]): void {
    const configs = Array.isArray(staticConfig) ? staticConfig : [staticConfig];
    return this.loader.register(this.httpAdapter, configs);
  }

  async start(): Promise<any> {
    if (!this.optionsArr?.length) {
      return;
    }
    return this.register(this.optionsArr);
  }
}
