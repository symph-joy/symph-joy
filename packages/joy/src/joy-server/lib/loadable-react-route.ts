import { createReactRouteResolver } from "@symph/react";
import { JoyReactApplicationContext } from "../../react/joy-react-application-context";

export function createJoyReactRouteResolver(routePath: string, componentName: string, componentPackage: undefined | string) {
  const resolver = createReactRouteResolver(routePath, componentName, componentPackage);
  function wrapper(appContext: JoyReactApplicationContext, objModule: Record<string, unknown>, props?: any): JSX.Element {
    appContext.scannedModules.push(objModule); // 模块的路由信息已经存在，不需要重新扫描。
    return resolver(appContext, objModule);
  }
  return wrapper;
}
