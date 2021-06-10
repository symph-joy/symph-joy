import { Configuration, Injectable } from "@symph/core";

@Injectable()
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
}
