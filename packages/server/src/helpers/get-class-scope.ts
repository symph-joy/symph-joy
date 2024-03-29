// import { Scope } from '@nestjs/common';
// import { SCOPE_OPTIONS_METADATA } from '@nestjs/common/constants';
// import { Type } from '@nestjs/common/interfaces/type.interface';

import { Scope, Type } from "@symph/core";
import { SCOPE_OPTIONS_METADATA } from "../constants";

export function getClassScope(provider: Type<unknown>): Scope {
  const metadata = Reflect.getMetadata(SCOPE_OPTIONS_METADATA, provider);
  return metadata && metadata.scope;
}
