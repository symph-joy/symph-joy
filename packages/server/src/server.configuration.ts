import { Configuration } from "@symph/core";
import { NodeConfigConfiguration } from "@symph/config/server";
import { AbstractHttpAdapter } from "./adapters";
import { ApplicationConfig } from "./application-config";
import { FastifyAdapter } from "./platform/fastify";

export const COMPONENT_HTTP_ADAPTER = Symbol("httpAdapter");

@Configuration()
export class ServerConfiguration {
  @Configuration.Provider()
  public configConfiguration: NodeConfigConfiguration;

  @Configuration.Provider()
  public applicationConfig: ApplicationConfig;

  @Configuration.Provider({ name: COMPONENT_HTTP_ADAPTER })
  public httpAdapter(): AbstractHttpAdapter {
    return new FastifyAdapter();
  }
}
