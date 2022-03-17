import { RouteObject } from "react-router";
import { ComponentName } from "@symph/core";

export interface IReactRoute extends RouteObject {
  path: string;
  componentName?: ComponentName;
  componentPackage?: string;
  componentModule?: Record<string, any>;
  hasState?: boolean;
  hasStaticState?: boolean;
  isContainer?: boolean;
  children?: IReactRoute[];

  /**
   * 捕获剩余路由的变量名称，react-router 默认为`*`，但在文件路由中，需要一个文件名来替换'*'， 例如：当path="/a/[...b]"时，catchAllParam='b'
   */
  catchAllParam?: string;
}
