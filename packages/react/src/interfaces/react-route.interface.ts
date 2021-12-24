import { RouteObject, RouteProps } from "react-router-dom";
import { ComponentName } from "@symph/core";

export interface IReactRoute extends RouteObject {
  path: string;
  componentName?: ComponentName;
  componentPackage?: string;
  dynamic?: boolean;
  componentModule?: Record<string, any>;
  hasState?: boolean;
  hasStaticState?: boolean;
  isContainer?: boolean;
  children?: IReactRoute[];
}
