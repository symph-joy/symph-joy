import { Value } from "@symph/config";
import { Component } from "@symph/core";

@Component()
export class BasicConfig {
  @Value()
  public msg: string;
}
