import { Configuration, Component } from "@symph/core";
import { ConfigConfiguration } from "@symph/config";

@Component()
export class HelloProvider {
  private message = "hello world";

  hello() {
    return this.message;
  }
}

@Configuration()
export class ServerProvidersConfig {
  @Configuration.Provider()
  public helloProvider: HelloProvider;

  @Configuration.Provider()
  private configConfiguration: ConfigConfiguration;

  // @Configuration.Provider()
  // public fsConfigLoader: FsConfigLoader;
}
