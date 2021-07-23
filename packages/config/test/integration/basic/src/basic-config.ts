import { Configurable, ConfigValue } from "@symph/config";
import { Injectable } from "@symph/core";

@Injectable()
@Configurable()
export class BasicConfig {
  @ConfigValue()
  public msg: string;
}
