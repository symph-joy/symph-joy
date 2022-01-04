import { getRouteMeta, META_KEY_REACT_CONTROLLER, ReactComponent } from "@symph/react";
import { isPrerenderClazz } from "./prerender.interface";
import { getComponentMeta } from "@symph/core";

const JOY_PRERENDER_META = "__joy_prerender";

export type PrerenderMeta = {
  route: string;
  paths: string[];
  isFallback: boolean;
  routeComponent?: { new (...args: any[]): any };
};

export interface PrerenderOptions {
  route?: string;
  routeComponent?: { new (...args: any[]): any };
  paths?: string[];
  isFallback?: boolean;
}

export function Prerender(options: PrerenderOptions = {}): <TFunction extends Function>(constructor: TFunction) => TFunction | void {
  return (constructor) => {
    if (isPrerenderClazz(constructor)) {
      const { route, routeComponent, paths, isFallback } = options;
      if (paths?.length) {
        throw new Error(`"paths" should not be defined in @Prerender() parameters, when  @Prerender decorating the class(${constructor.name}).`);
      }
      if (!route && !routeComponent) {
        throw new Error(
          `"route" or "controller" should be defined in @Prerender() parameters, when  @Prerender decorating the class(${constructor.name}).`
        );
      }
      // 在组件加载分析阶段获取routeComponent的route信息，因为如果是文件约定路由，此时的routeComponent没有绑定路由信息。
      let resolvedRoute = route;
      const compMeta = getComponentMeta(routeComponent as any);
      if (!compMeta) {
        throw new Error(`"routeComponent" is not a joy component, when @Prerender decorating the class(${constructor.name}).`);
      }

      const meta = {
        routeComponent,
        route: resolvedRoute,
      } as PrerenderMeta;

      Reflect.defineMetadata(JOY_PRERENDER_META, meta, constructor);
      ReactComponent(Object.assign({}, options, { lazyRegister: true }))(constructor);
    } else {
      const metaCtrl = Reflect.getMetadata(META_KEY_REACT_CONTROLLER, constructor);
      if (!metaCtrl) {
        throw new Error(`The component(${constructor.name}) is not a react controller, so can't decorate by @Prerender(). `);
      }

      const { route, paths, isFallback } = options || {};
      let resolvedRoute = route;
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
        } else {
          resolvedRoute = Array.isArray(routeMeta.path) ? routeMeta.path[0] : routeMeta.path;
        }
        // const routePath = routeMeta.path as string;
        // if (isDynamicRoute(routePath)) {
        //   throw new Error(`route.path should not be a dynamic path, When @Prerender() decorate a route component(${constructor.name}).`);
        // }
      } else {
        // 有可能是文件路由，所以不做非空判断
        //   throw new Error(`The component(${constructor.name}) is not a route component, so can't decorate by @Prerender(). `);
      }
      let resolvedPath = paths;
      if (!resolvedPath?.length) {
        resolvedPath = resolvedRoute ? [resolvedRoute] : undefined;
      }

      const meta = Object.assign(
        {
          routeComponent: undefined,
          route: resolvedRoute,
          paths: resolvedPath,
        },
        options
      ) as PrerenderMeta;
      Reflect.defineMetadata(JOY_PRERENDER_META, meta, constructor);
    }
  };
}

export function getPrerenderMeta(target: object): PrerenderMeta {
  return Reflect.getMetadata(JOY_PRERENDER_META, target);
}
