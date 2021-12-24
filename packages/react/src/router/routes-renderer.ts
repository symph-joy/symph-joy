import { useRoutes } from "react-router";
import { IReactRoute } from "../interfaces";

export function RoutesRenderer({ routes, location }: { routes: IReactRoute[]; location?: Partial<Location> & { pathname: string } }) {
  return useRoutes(routes, location);
}
