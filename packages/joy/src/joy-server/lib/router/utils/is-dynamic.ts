// Identify /[param]/ in route string
const TEST_ROUTE = /\/\[[^/]+?\](?=\/|$)/;

const TEST_ROUTE_1 = /\/:[^/]+?(?=\/|$)/;

export function isDynamicRoute(route: string): boolean {
  return TEST_ROUTE.test(route) || TEST_ROUTE_1.test(route);
}
