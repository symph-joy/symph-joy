import { RpcExceptionFilter } from "./rpc-exception-filter.interface";
import { Type } from "@symph/core";

export interface RpcExceptionFilterMetadata {
  func: RpcExceptionFilter["catch"];
  exceptionMetatypes: Type<any>[];
}
