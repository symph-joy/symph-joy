import { RuntimeException } from "./runtime.exception";
import { Abstract, Type } from "../../interfaces";

export class NotUniqueMatchedProviderException extends RuntimeException {
  constructor(type: Type | Abstract, matchedProviderNames: string[]) {
    super(
      `There is more than one (${matchedProviderNames}) provider match type(${type.name}). `
    );
  }
}
