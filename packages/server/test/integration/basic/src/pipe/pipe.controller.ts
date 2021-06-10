import { Controller, Get, Header, Param } from "@symph/server";
import { Observable, of } from "rxjs";
import { PipeUserByIdPipe } from "./pipe-user-by-id.pipe";

@Controller("pipe")
export class PipeController {
  @Get(":id")
  get(
    @Param("id", PipeUserByIdPipe)
    user: any
  ): any {
    return user;
  }
}
