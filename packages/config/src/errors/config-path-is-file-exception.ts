import { RuntimeException } from "@symph/core";

export class ConfigPathIsFileException extends RuntimeException {
  constructor(path: string) {
    super();
    this.message = `Can not load configs, the path(${path}) is file, but expect it is a directory.`;
  }
}
