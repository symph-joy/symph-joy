import { getRouteMeta, META_KEY_REACT_CONTROLLER, ReactComponent } from "@symph/react";
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

export function Prerender(options?: PrerenderMeta | undefined): <TFunction extends Function>(constructor: TFunction) => TFunction | void {
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
      const metaCtrl = Reflect.getMetadata(META_KEY_REACT_CONTROLLER, constructor);
      if (!metaCtrl) {
        throw new Error(`The component(${constructor.name}) is not a react controller, so can't decorate by @Prerender(). `);
      }
      const { route, paths, isFallback } = options || {};
      const routeMeta = getRouteMeta(constructor);
      if (routeMeta) {
        if (route) {
          if (Array.isArray(routeMeta.path)) {
            if (!routeMeta.path.indexOf(route)) {
              throw new Error(`The @Prerender()'s route is not one of the @Routes()'s path, component(${constructor.name}).`);
            }
          } else if (route !== routeMeta.path) {
            throw new Error(`The @Prerender()'s route is not equal the @Routes()'s path, component(${constructor.name}).`);
          }
        }
        // const routePath = routeMeta.path as string;
        // if (isDynamicRoute(routePath)) {
        //   throw new Error(`route.path should not be a dynamic path, When @Prerender() decorate a route component(${constructor.name}).`);
        // }
      } else {
        // 有可能是文件路由，所以不做非空判断
        //   throw new Error(`The component(${constructor.name}) is not a route component, so can't decorate by @Prerender(). `);
      }

      const meta = Object.assign(
        {
          // route: routePath,
          // paths: [routePath],
          // isFallback: false,
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
