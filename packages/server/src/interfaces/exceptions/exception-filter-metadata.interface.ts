import { ExceptionFilter } from "./exception-filter.interface";
import { Type } from "@symph/core";

export interface ExceptionFilterMetadata {
  func: ExceptionFilter["catch"];
  exceptionMetatypes: Type<any>[];
}
