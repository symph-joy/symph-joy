import { Configuration, Inject, Component, IComponentLifecycle } from "@symph/core";
import { AbstractHttpAdapter } from "../../adapters";
import { ServeStaticService } from "./serve-static.service";
import { ServeStaticOptions } from "./interfaces/serve-static-options.interface";
import { Value } from "@symph/config";
import { FastifyLoader } from "./loaders/fastify.loader";
import { AbstractLoader } from "./loaders/abstract.loader";

@Configuration()
@Component()
export class ServeStaticConfig implements IComponentLifecycle {
  @Inject()
  private httpAdapter: AbstractHttpAdapter;

  @Value()
  private static: ServeStaticOptions[];

  @Configuration.Component()
  @Inject()
  public loader: FastifyLoader;

  @Configuration.Component()
  public staticServer(): ServeStaticService {
    return this.instanceService(this.httpAdapter, this.getConfigs(), this.loader);
  }

  initialize(): Promise<void> | void {}

  public getConfigs(): ServeStaticOptions[] {
    return this.static;
  }

  public instanceService(httpAdapter: AbstractHttpAdapter, options: ServeStaticOptions[], loader: AbstractLoader): ServeStaticService {
    return new ServeStaticService(httpAdapter, options, loader);
  }
}
