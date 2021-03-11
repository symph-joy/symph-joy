import { NAMESPACE_SEP } from "../../../constants";
import { IJoyContext } from "../../../interfaces";

export default function createModelMiddleware(app: IJoyContext) {
  return (store) => (next) => (action) => {
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
