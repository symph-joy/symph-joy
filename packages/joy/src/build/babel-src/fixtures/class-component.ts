import { Component } from "@symph/core";
import { ConfigValue } from "@symph/config";

@Component({ name: "aTestClass" })
export class TestClass {
  @ConfigValue()
  public configValue: string;
}
