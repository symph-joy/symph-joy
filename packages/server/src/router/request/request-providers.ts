import { REQUEST } from "./request-constants";
import { Provider, Scope } from "@symph/core";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};
export const requestProvider: Provider = {
  name: REQUEST,
  type: Object,
  scope: Scope.REQUEST,
  useFactory: noop,
};
