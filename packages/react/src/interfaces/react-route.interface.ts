import { RouteProps } from "react-router-dom";

export interface IReactRoute extends RouteProps {
  path: string;
  providerId?: string;
  hasState?: boolean;
  hasStaticState?: boolean;
  routes?: IReactRoute[];
}
