import { Component } from "@symph/core";

@Component()
export class PipeUsersService {
  findById(id: string) {
    return { id };
  }
}
