import { Type } from "./type.interface";

export interface InjectCustomOptionsInterface {
  name?: string | symbol | undefined;
  type?: Type | undefined;
  isOptional?: boolean;
}
