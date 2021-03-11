import { IReactRoute } from "../interfaces/react-route.interface";
import { Component } from "react";
import { getInjectableMeta } from "@symph/core";

const REACT_ROUTE_META_KEY = "__joy_route";

export interface IReactRouteMatched {
  isExact: boolean;
  params: Record<string, any>;
  path: string;
  url: string;
}

type IRouteMeta = {
  path: string | string[];
} & Pick<IReactRoute, "exact" | "sensitive" | "strict">;

export function Route<T>(
  options: Partial<IRouteMeta> = {}
): <TFunction extends Function>(constructor: TFunction) => TFunction | void {
  return (constructor) => {
    const injectableMeta = getInjectableMeta(constructor);
    if (!injectableMeta) {
      throw new Error(
        `@Route() decorator used on ${constructor.name} class, but ${constructor.name} is not an injectable component`
      );
    }

    options = Object.assign({}, options);
    Reflect.defineMetadata(REACT_ROUTE_META_KEY, options, constructor);
    return constructor;
  };
}

export function getRouteMeta(target: Object): IRouteMeta {
  return Reflect.getMetadata(REACT_ROUTE_META_KEY, target);
}

export type IReactRouteParamBind = {
  name: string;
  propKey: string;
  type: string | number | boolean;
  transform?: { (param: string): any };
  isOptional: boolean;
};

export function RouteParam(
  options: Partial<Omit<IReactRouteParamBind, "propKey">> = {}
) {
  return (target: Object, propKey: string) => {
    const { name, type, isOptional = false, ...restOps } = options;
    const paramName = name || propKey;
    const paramType =
      type || Reflect.getMetadata("design:type", target, propKey) || String;

    let params: IReactRouteParamBind[] =
      Reflect.getMetadata("ROUTE_PARAMS", target) || [];

    params = [
      ...params,
      { propKey, name: paramName, type: paramType, isOptional, ...restOps },
    ];
    Reflect.defineMetadata("ROUTE_PARAMS", params, target);
  };
}

export function bindRouteFromCompProps(
  routeCompInstance: Component<any>,
  props: Record<string, any>
): IReactRouteParamBind[] {
  const parmas: IReactRouteParamBind[] = Reflect.getMetadata(
    "ROUTE_PARAMS",
    routeCompInstance
  );

  const match = props.match as IReactRouteMatched | undefined;
  if (!match) {
    throw new Error(
      "@RouteParam() decorator must be used on Component, which is decorated by @Route()"
    );
  }
  const matchedParams = match.params || {};
  if (parmas && parmas.length) {
    for (let i = 0; i < parmas.length; i++) {
      const { propKey, name, type, transform, isOptional } = parmas[i];
      const value: string = matchedParams[name];
      if ((value === undefined || value === null) && isOptional) {
        throw new Error(
          `route param(${name}) must not to be null, on property${propKey}`
        );
      }
      let transformedValue: typeof type = value;
      const strTypeof = typeof type;
      if (transform) {
        transformedValue = transform(value);
      } else {
        if ((type as any) === Number || strTypeof === "number") {
          transformedValue = new Number(value).valueOf();
        } else if ((type as any) === Boolean || strTypeof === "boolean") {
          transformedValue = new Boolean(value).valueOf();
        } else if ((type as any) === String || strTypeof === "string") {
          transformedValue = value;
        } else {
          throw new Error(
            `can't recognise type to route param(${name}) type, on property${propKey}`
          );
        }
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore no necessary check type
      routeCompInstance[propKey] = transformedValue;
    }
  }

  console.log(">> params", parmas);

  return parmas;
}
