import { Type } from "./type.interface";

export enum EnuInjectBy {
  NAME = "NAME",
  TYPE = "TYPE",
  TYPE_NAME = "TYPE_NAME", // 先通过TYPE，在通过NAME
}

/**
 * The dependency of a provider
 */
export interface IInjectableDependency {
  index?: number; // when constructor or usrFactory
  key?: string | symbol; // when property-base
  designType?: Type; // property type
  name?: string | symbol; // dependency provider name
  type?: Type; // dependency provider type
  injectBy?: EnuInjectBy;
  isOptional?: boolean;
  instance?: unknown;
}
