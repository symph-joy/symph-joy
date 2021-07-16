import {
  Configuration,
  Inject,
  Injectable,
  ProviderLifecycle,
} from "@symph/core";
import { AbstractHttpAdapter } from "../../adapters";
import { ServeStaticService } from "./serve-static.service";
import { ServeStaticOptions } from "./interfaces/serve-static-options.interface";
import { ConfigValue, Configurable } from "@symph/config";
import { FastifyLoader } from "./loaders/fastify.loader";
import { AbstractLoader } from "./loaders/abstract.loader";

@Configurable()
@Configuration()
@Injectable()
export class ServeStaticConfig implements ProviderLifecycle {
  @Inject()
  private httpAdapter: AbstractHttpAdapter;

  @ConfigValue()
  private static: ServeStaticOptions[];

  @Configuration.Provider()
  @Inject()
  public loader: FastifyLoader;

  @Configuration.Provider()
  public staticServer(): ServeStaticService {
    return this.instanceService(
      this.httpAdapter,
      this.getConfigs(),
      this.loader
    );
  }

  afterPropertiesSet(): Promise<void> | void {}

  public getConfigs(): ServeStaticOptions[] {
    return this.static;
  }

  public instanceService(
    httpAdapter: AbstractHttpAdapter,
    options: ServeStaticOptions[],
    loader: AbstractLoader
  ): ServeStaticService {
    return new ServeStaticService(httpAdapter, options, loader);
  }
}
