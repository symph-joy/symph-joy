// import { InjectorDependencyContext } from '../../injector/injector';
import { UNKNOWN_DEPENDENCIES_MESSAGE } from "../messages";
import { RuntimeException } from "./runtime.exception";
import { InjectorDependencyContext } from "@symph/core";
// import { Module } from '../../injector/module';

export class UnknownDependenciesException extends RuntimeException {
  constructor(
    type: string | symbol,
    unknownDependencyContext: InjectorDependencyContext
    // module?: Module,
  ) {
    super(UNKNOWN_DEPENDENCIES_MESSAGE(type, unknownDependencyContext));
  }
}
