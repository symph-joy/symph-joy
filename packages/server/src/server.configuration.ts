import { Configuration } from "@symph/core";
import { NodeConfigConfiguration } from "@symph/config/server";
import { AbstractHttpAdapter } from "./adapters";
import { ApplicationConfig } from "./application-config";
import { FastifyAdapter } from "./platform/fastify";

export const COMPONENT_HTTP_ADAPTER = Symbol("httpAdapter");

@Configuration()
export class ServerConfiguration {
  @Configuration.Component()
  public configConfiguration: NodeConfigConfiguration;

  @Configuration.Component()
  public applicationConfig: ApplicationConfig;

  @Configuration.Component({ name: COMPONENT_HTTP_ADAPTER })
  public httpAdapter(): AbstractHttpAdapter {
    return new FastifyAdapter();
  }
}
