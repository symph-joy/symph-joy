import { RuntimeException } from "./runtime.exception";
import { isNil } from "../../utils/shared.utils";

export class InvalidDependencyTypeException extends RuntimeException {
  constructor(
    providerName: string,
    constructorIndex: number,
    prpKey: string,
    msgWhy: string
  ) {
    let message = `Can't resolve dependencies of the ${providerName}`;

    if (isNil(constructorIndex)) {
      message += `. Please make sure that the "${prpKey.toString()}" property,`;
    } else {
      message += `. Please check that the argument ${providerName} at index [${constructorIndex}], reason:`;
    }
    message += msgWhy;

    super(message);
  }
}
