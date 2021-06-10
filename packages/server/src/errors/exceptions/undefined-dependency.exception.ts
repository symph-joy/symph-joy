// import { InjectorDependencyContext } from '../../injector/injector';
import { UNKNOWN_DEPENDENCIES_MESSAGE } from "../messages";
import { RuntimeException } from "./runtime.exception";
import { InjectorDependencyContext } from "@symph/core";
// import * as Module from "module";
// import { Module } from '../../injector/module';

export class UndefinedDependencyException extends RuntimeException {
  constructor(
    type: string,
    undefinedDependencyContext: InjectorDependencyContext,
    module?: any
  ) {
    super(UNKNOWN_DEPENDENCIES_MESSAGE(type, undefinedDependencyContext));
  }
}
