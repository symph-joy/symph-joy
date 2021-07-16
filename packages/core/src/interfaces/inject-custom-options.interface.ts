import { Type } from "./type.interface";

export interface InjectCustomOptionsInterface {
  name?: string | undefined;
  type?: Type | undefined;
  isOptional?: boolean;
}
