import { Injectable } from "@symph/core";

@Injectable()
export class PipeUsersService {
  findById(id: string) {
    return { id };
  }
}
