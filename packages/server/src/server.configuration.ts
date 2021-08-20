import { Configuration, Component } from "@symph/core";
import { NodeConfigConfiguration, SYMPH_CONFIG_INIT_VALUE } from "@symph/config";
import { AbstractHttpAdapter } from "./adapters";

const NAME_HTTP_SERVER_ADAPTER = Symbol("httpAdapter");

@Configuration()
export class ServerConfiguration {
  @Configuration.Provider()
  public configConfiguration: NodeConfigConfiguration;

  @Configuration.Provider({ name: NAME_HTTP_SERVER_ADAPTER })
  public httpAdapter(): AbstractHttpAdapter {
    const { FastifyAdapter } = require("./platform/fastify");
    return new FastifyAdapter();
  }
}
