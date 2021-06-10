import { PipeController } from "./pipe.controller";
import { Configuration } from "@symph/core";
import { PipeUsersService } from "./pipe-users.service";
import { PipeUserByIdPipe } from "./pipe-user-by-id.pipe";

@Configuration()
export class PipeConfig {
  @Configuration.Provider()
  pipeController: PipeController;

  @Configuration.Provider()
  usersService: PipeUsersService;

  @Configuration.Provider()
  userByIdPipe: PipeUserByIdPipe;
}
