import { Component } from "@symph/core";
import { Value } from "@symph/config";

@Component({ name: "aTestClass" })
export class TestClass {
  @Value()
  public configValue: string;
}
