import { HelloClass } from "./hello-class"; // 忽略
import { ClassComponent } from "./class-component"; // 不忽略
import { Component } from "@symph/core"; // 不忽略
import { ClassDecorator } from "./class-decorator"; // 不忽略，其子属性有被使用。

const { PropDecorator } = ClassDecorator;

@Component()
export class IgnoreNoneUsedModuleHost extends Object {
  @PropDecorator()
  private msg: string;

  private helloClass: HelloClass;

  constructor() {
    super();
    const helloClass = new HelloClass("Hello");
  }
}
