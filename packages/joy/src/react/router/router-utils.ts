import { IReactRoute } from "@symph/react";
import { matchPath } from "react-router";

export function getMatchedRoutes(pathname: string, routes?: IReactRoute[], matchContext: IReactRoute[] = []): IReactRoute[] {
  routes = routes || [];
  if (!routes?.length) {
    return matchContext;
  }
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    const m = matchPath(pathname, route);
    if (!m) {
      continue;
    }
    const matchedRoute = { ...route };
    matchContext.push(matchedRoute);
    if (route.routes?.length) {
      matchedRoute.routes = getMatchedRoutes(pathname, route.routes, matchContext);
    }
  }
  return matchContext;
}

function parseParameter(param: string) {
  const optional = param.startsWith("[") && param.endsWith("]");
  if (optional) {
    param = param.slice(1, -1);
  }
  const repeat = param.startsWith("...");
  if (repeat) {
    param = param.slice(3);
  }
  return { key: param, repeat, optional };
}

/**
 * 转换示例：
 * [a] -> :a
 * [a$] -> :a?
 * [...a] => :a+
 * [...a$] => :a*
 * @param routePath
 */
export function normalizeConventionRoute(routePath: string): string {
  return routePath
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      let isOptional = false;
      let isCatchAll = false;
      if (segment.startsWith("[") && segment.endsWith("]")) {
        segment = segment.slice(1, -1);
        if (segment.startsWith("...")) {
          isCatchAll = true;
          segment = segment.slice(3);
        }
        if (segment.endsWith("$")) {
          isOptional = true;
          segment = segment.slice(0, -1);
        }
        if (isCatchAll) {
          if (isOptional) {
            return `/:${segment}*`;
          } else {
            return `/:${segment}+`;
          }
        } else {
          if (isOptional) {
            return `/:${segment}?`;
          } else {
            return `/:${segment}`;
          }
        }
      } else {
        return `/${segment}`;
      }
    })
    .join("");
}
