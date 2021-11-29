import { IApplicationContext } from "@symph/core";

export const NAMESPACE_SEP = "/";

export default function createModelMiddleware(app: IApplicationContext) {
  return (store: any) => (next: any) => (action: any) => {
    const { type } = action;
    if (type.indexOf("/") <= 0) {
      return next(action);
    }
    const [namespace, funName] = type.split(NAMESPACE_SEP);
    if (funName.indexOf("__") === 0) {
      return next(action);
    }

    const model = app.get(namespace);
    const fun = model && model[funName];

    if (fun !== undefined && fun !== null) {
      return fun.call(model, action);
    } else {
      return next(action);
    }
  };
}
