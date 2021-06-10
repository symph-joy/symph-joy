import { PipeUsersService } from "./pipe-users.service";
import { Injectable } from "@symph/core";
import { ArgumentMetadata, PipeTransform } from "@symph/server";

@Injectable()
export class PipeUserByIdPipe implements PipeTransform<string> {
  constructor(private readonly usersService: PipeUsersService) {}

  transform(value: string, metadata: ArgumentMetadata) {
    return this.usersService.findById(value);
  }
}
