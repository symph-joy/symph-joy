import { PipeUsersService } from "./pipe-users.service";
import { Component } from "@symph/core";
import { ArgumentMetadata, PipeTransform } from "@symph/server";

@Component()
export class PipeUserByIdPipe implements PipeTransform<string> {
  constructor(private readonly usersService: PipeUsersService) {}

  transform(value: string, metadata: ArgumentMetadata) {
    return this.usersService.findById(value);
  }
}
