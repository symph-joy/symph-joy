import { Component } from "@symph/core";

@Component()
export class HelloService {
  greeting(): string {
    return "Hello world!";
  }
}
