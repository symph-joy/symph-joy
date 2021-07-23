import { Injectable } from "@symph/core";

@Injectable()
export class HelloService {
  greeting(): string {
    return "Hello world!";
  }
}
