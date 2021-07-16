import { Controller, Get, Header } from "@symph/server";

@Controller("hello")
export class HelloController {
  @Get("hi")
  @Header("Authorization", "Bearer")
  greeting(): string {
    return "Hello world!";
  }
}
