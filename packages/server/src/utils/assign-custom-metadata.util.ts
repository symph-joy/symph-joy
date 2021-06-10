import { CUSTOM_ROUTE_AGRS_METADATA } from "../constants";
import {
  ParamData,
  RouteParamMetadata,
} from "../decorators/http/route-params.decorator";
// import { PipeTransform, Type } from '../interfaces';
import { CustomParamFactory } from "../interfaces/features/custom-route-param-factory.interface";
import { PipeTransform } from "../interfaces/features/pipe-transform.interface";
import { Type } from "@symph/core";

export function assignCustomParameterMetadata(
  args: Record<number, RouteParamMetadata>,
  paramtype: number | string,
  index: number,
  factory: CustomParamFactory,
  data?: ParamData,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
) {
  return {
    ...args,
    [`${paramtype}${CUSTOM_ROUTE_AGRS_METADATA}:${index}`]: {
      index,
      factory,
      data,
      pipes,
    },
  };
}
