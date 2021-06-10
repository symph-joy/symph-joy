// import { ContextId } from '../../injector';
import { ParamProperties } from "../context-utils";
import { ContextId } from "@symph/core";

type ParamPropertiesWithMetatype<T = any> = ParamProperties & { metatype?: T };
export interface ExternalHandlerMetadata {
  argsLength: number;
  paramtypes: any[];
  getParamsMetadata: (
    // moduleKey: string,
    contextId?: ContextId
    // inquirerId?: string,
  ) => ParamPropertiesWithMetatype[];
}
