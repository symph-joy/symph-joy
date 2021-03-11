import { IModel } from "../react/interfaces/model.interface";
import { Type } from "./type.interface";

/**
 * The constructor-based dependency
 */
export interface ConstructorDependency {
  index: number;
  name: string;
  mateType: Type | undefined;
  isOptional?: boolean;
  instance: IModel<any>;
}
