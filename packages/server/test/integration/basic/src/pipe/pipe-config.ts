import { PipeController } from "./pipe.controller";
import { Configuration } from "@symph/core";
import { PipeUsersService } from "./pipe-users.service";
import { PipeUserByIdPipe } from "./pipe-user-by-id.pipe";

@Configuration()
export class PipeConfig {
  @Configuration.Component()
  pipeController: PipeController;

  @Configuration.Component()
  usersService: PipeUsersService;

  @Configuration.Component()
  userByIdPipe: PipeUserByIdPipe;
}
