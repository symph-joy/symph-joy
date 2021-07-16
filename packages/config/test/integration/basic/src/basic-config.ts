import { Configurable, ConfigValue } from "../../../../src";
import { Injectable } from "@symph/core";

@Injectable()
@Configurable()
export class BasicConfig {
  @ConfigValue()
  public msg: string;
}
