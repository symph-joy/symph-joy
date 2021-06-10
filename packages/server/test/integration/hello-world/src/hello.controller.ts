import { Controller, Get, Header, Param } from "@symph/server";
import { Observable, of } from "rxjs";
import { HelloService } from "./hello.service";

@Controller("hello")
export class HelloController {
  constructor(private readonly helloService: HelloService) {}

  @Get("hi")
  @Header("Authorization", "Bearer")
  greeting(): string {
    return this.helloService.greeting();
  }

  @Get("async")
  async asyncGreeting(): Promise<string> {
    return this.helloService.greeting();
  }

  @Get("stream")
  streamGreeting(): Observable<string> {
    return of(this.helloService.greeting());
  }
}
