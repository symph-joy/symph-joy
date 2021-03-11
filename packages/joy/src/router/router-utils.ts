import { IReactRoute } from "@symph/react";
import { matchPath } from "react-router";

export function getMatchedRoutes(
  pathname: string,
  routes?: IReactRoute[],
  matchContext: IReactRoute[] = []
): IReactRoute[] {
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
      matchedRoute.routes = getMatchedRoutes(
        pathname,
        route.routes,
        matchContext
      );
    }
  }
  return matchContext;
}
