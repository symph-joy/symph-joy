import { RuntimeException } from "./runtime.exception";

export class InvalidInjectOptionException extends RuntimeException {
  constructor(target: any, key: string, index: number, message: string) {
    if (key) {
      super(
        `@Inject() parameter error:${message}. target:${target.name},key:${key}`
      );
    } else {
      super(
        `@Inject() parameter error:${message}. target:${target.name},index:${index}`
      );
    }
  }
}
