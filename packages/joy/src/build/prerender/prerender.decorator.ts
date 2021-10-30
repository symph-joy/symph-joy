import { Component, Type } from "@symph/core";
import { getRouteMeta, ReactComponent } from "@symph/react";
import { isPrerenderClazz } from "./prerender.interface";
import { isDynamicRoute } from "../../joy-server/lib/router/utils";

const JOY_PRERENDER_META = "__joy_prerender";

export type PrerenderMeta = {
  route: string;
  paths: string[];
  isFallback: boolean;
};

export type PrerenderMetaByProvider = {
  byProvider: boolean;
};

export function Prerender(options?: PrerenderMeta): <TFunction extends Function>(constructor: TFunction) => TFunction | void {
  return (constructor) => {
    if (isPrerenderClazz(constructor)) {
      if (options) {
        throw new Error(`There is no need any options, when @Prerender() decorate a class${constructor.name} is implement JoyPrerenderInterface.`);
      }
      const meta = {
        byProvider: true,
      } as PrerenderMetaByProvider;
      Reflect.defineMetadata(JOY_PRERENDER_META, meta, constructor);
      ReactComponent(Object.assign({}, options, { lazyRegister: true }))(constructor);
    } else {
      const routeMeta = getRouteMeta(constructor);
      if (!routeMeta) {
        throw new Error(`The component(${constructor.name}) is not a route component, so can't decorate by @Prerender(). `);
      }
      if (Array.isArray(routeMeta.path) && !options?.route) {
        throw new Error(`The controller's route.path should not be an array, When @Prerender() decorate a route component(${constructor.name}).`);
      }
      const routePath = routeMeta.path as string;
      if (isDynamicRoute(routePath)) {
        throw new Error(`route.path should not be a dynamic path, When @Prerender() decorate a route component(${constructor.name}).`);
      }

      const meta = Object.assign(
        {
          route: routePath,
          paths: [routePath],
          isFallback: false,
        },
        options
      ) as PrerenderMeta;
      Reflect.defineMetadata(JOY_PRERENDER_META, meta, constructor);
    }
  };
}

export function getPrerenderMeta(target: object): PrerenderMeta | PrerenderMetaByProvider {
  return Reflect.getMetadata(JOY_PRERENDER_META, target);
}
