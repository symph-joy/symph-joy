import React, { useContext, useMemo } from "react";
import { useRoutes, UNSAFE_RouteContext, UNSAFE_LocationContext, matchRoutes } from "react-router";
import { IReactRoute } from "../interfaces";

export function RoutesRenderer({ routes, location: locationArg }: { routes: IReactRoute[]; location?: Partial<Location> & { pathname: string } }) {
  const route = useContext(UNSAFE_RouteContext);
  const locationCtxValue = useContext(UNSAFE_LocationContext);
  let location = locationArg || locationCtxValue.location;
  const matches = useMemo(() => matchRoutes(routes, location || locationCtxValue.location), [location]);
  if (!matches?.length && !route.matches?.length) {
    location = Object.assign({}, location, { pathname: "/404" });
  }
  return (
    <UNSAFE_LocationContext.Provider value={{ location: location as any, navigationType: locationCtxValue.navigationType }}>
      {useRoutes(routes, location)}
    </UNSAFE_LocationContext.Provider>
  );
  // return useRoutes(routes, location);
}
