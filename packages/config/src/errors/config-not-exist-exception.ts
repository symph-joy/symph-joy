import { RuntimeException } from "@symph/core";

export class ConfigNotExistException extends RuntimeException {
  constructor(path: string) {
    super();
    this.message = `Can not load config, the path(${path}) is not exists.`;
  }
}
