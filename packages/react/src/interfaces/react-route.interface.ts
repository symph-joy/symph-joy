import { RouteProps } from "react-router-dom";

export interface IReactRoute extends RouteProps {
  providerId?: string;
  routes?: IReactRoute[];
}
