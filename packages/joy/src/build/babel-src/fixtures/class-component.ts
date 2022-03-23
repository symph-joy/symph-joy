import { Component } from "@symph/core";
import { Value } from "@symph/config";

@Component({ name: "aClassComponent" })
export class ClassComponent {
  @Value()
  public configValue: string;
}
