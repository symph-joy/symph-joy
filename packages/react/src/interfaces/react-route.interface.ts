import { RouteProps } from "react-router-dom";
import { ComponentName } from "@symph/core";

export interface IReactRoute extends RouteProps {
  path: string;
  providerName?: ComponentName;
  providerPackage?: string;
  dynamic?: boolean;
  providerModule?: Record<string, any>;
  hasState?: boolean;
  hasStaticState?: boolean;
  isContainer?: boolean;
  routes?: IReactRoute[];
}
