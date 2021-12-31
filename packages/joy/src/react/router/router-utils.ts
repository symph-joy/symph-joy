import { IReactRoute } from "@symph/react";
import { matchPath } from "react-router";

const TEST_ROUTE = /\/\[[^/]+?\](?=\/|$)/;

const TEST_ROUTE_1 = /\/:[^/]+?(?=\/|$)/;
const TEST_ROUTE_2 = /\*$/;

export function isDynamicRoute(route: string): boolean {
  return TEST_ROUTE_1.test(route) || TEST_ROUTE_2.test(route) || TEST_ROUTE.test(route);
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

/**
 * 转换示例：
 * [a] -> :a
 * [...a] => /*;
 * @param routePath
 */
export function normalizeConventionRouteV6(routePath: string): { path: string; catchAllParam?: string } {
  let catchAllParam: string | undefined = undefined;
  let path = routePath
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      let isCatchAll = false;
      if (segment.startsWith("[") && segment.endsWith("]")) {
        segment = segment.slice(1, -1);
        if (segment.startsWith("...")) {
          isCatchAll = true;
          segment = segment.slice(3);
        }
        if (isCatchAll) {
          catchAllParam = segment;
          return `/*`;
        } else {
          return `/:${segment}`;
        }
      } else {
        return `/${segment}`;
      }
    })
    .join("");
  if (path === "") {
    path = "/";
  }
  return { path, catchAllParam };
}
