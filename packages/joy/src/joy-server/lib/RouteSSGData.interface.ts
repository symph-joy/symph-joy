import { AnyAction } from "@symph/react/dist/redux";

export interface RouteSSGData {
  pathname: string;
  index?: boolean;
  ssgData: AnyAction[];
  revalidate?: number;
}
