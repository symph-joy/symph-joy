import { RouteProps } from "react-router-dom";
import { TProviderName } from "@symph/core";

export interface IReactRoute extends RouteProps {
  path: string;
  providerName?: TProviderName;
  dynamic?: boolean;
  providerModule?: Record<string, any>;
  hasState?: boolean;
  hasStaticState?: boolean;
  routes?: IReactRoute[];
}
