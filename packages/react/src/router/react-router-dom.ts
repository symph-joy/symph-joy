import type { To } from "react-router-dom";
import {
  createRoutesFromChildren,
  generatePath,
  matchPath,
  matchRoutes,
  MemoryRouter,
  Navigate,
  Outlet,
  renderMatches,
  resolvePath,
  Route,
  Router,
  Routes,
  useHref,
  useInRouterContext,
  useLocation,
  useMatch,
  useNavigate,
  useNavigationType,
  useOutlet,
  useOutletContext,
  useParams,
  useResolvedPath,
  useRoutes,
} from "react-router-dom";
import { BrowserRouter, HashRouter, Link, NavLink, useLinkClickHandler, useSearchParams } from "react-router-dom";

export {
  MemoryRouter,
  Navigate,
  Outlet,
  Route,
  Router,
  Routes,
  createRoutesFromChildren,
  generatePath,
  matchRoutes,
  matchPath,
  renderMatches,
  resolvePath,
  useHref,
  useInRouterContext,
  useLocation,
  useMatch,
  useNavigate,
  useNavigationType,
  useOutlet,
  useParams,
  useResolvedPath,
  useRoutes,
  useOutletContext,
};

export type {
  Location,
  Path,
  To,
  NavigationType,
  MemoryRouterProps,
  NavigateFunction,
  NavigateOptions,
  NavigateProps,
  Navigator,
  OutletProps,
  Params,
  PathMatch,
  RouteMatch,
  RouteObject,
  RouteProps,
  PathRouteProps,
  LayoutRouteProps,
  IndexRouteProps,
  RouterProps,
  RoutesProps,
} from "react-router-dom";

export { BrowserRouter, HashRouter, useLinkClickHandler, useSearchParams, Link, NavLink };

export type { BrowserRouterProps, HashRouterProps, HistoryRouterProps, LinkProps, NavLinkProps } from "react-router-dom";

export * from "./routes-renderer";
