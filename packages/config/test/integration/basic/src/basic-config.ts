import { Configurable, ConfigValue } from "@symph/config";
import { Component } from "@symph/core";

@Component()
@Configurable()
export class BasicConfig {
  @ConfigValue()
  public msg: string;
}
