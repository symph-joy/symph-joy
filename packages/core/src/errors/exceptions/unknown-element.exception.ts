import { RuntimeException } from "./runtime.exception";

export class UnknownElementException extends RuntimeException {
  constructor(name?: string) {
    super(
      `Joy could not find out provider(id:${
        name || "given"
      }) in the current context`
    );
  }
}
