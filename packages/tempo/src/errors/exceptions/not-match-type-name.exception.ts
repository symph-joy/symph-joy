import { RuntimeException } from "./runtime.exception";
import { Type } from "../../interfaces";

export class NotMatchTypeNameException extends RuntimeException {
  constructor(type: Type, name: string) {
    super(
      `can not find out a provider, which has type(${type.name}) and name (${name}). `
    );
  }
}
