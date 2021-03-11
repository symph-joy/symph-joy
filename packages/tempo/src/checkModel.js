import invariant from "invariant";
import { isArray, isFunction, isPlainObject } from "./utils";

export default function checkModel(model, existModels) {
  const { namespace, reducers, effects, subscriptions } = model;

  // namespace 必须被定义
  invariant(namespace, `model namespace should be defined`);
  // 并且是字符串
  invariant(
    typeof namespace === "string",
    `model namespace should be string, but got ${typeof namespace}`
  );
  // 并且唯一
  invariant(
    !existModels.some((model) => model.namespace === namespace),
    "model namespace should be unique"
  );

  // state 可以为任意值

  // reducers 可以为空，PlainObject 或者数组
  if (reducers) {
    invariant(
      isPlainObject(reducers) || isArray(reducers),
      `model reducers should be plain object or array, but got ${typeof reducers}`
    );
    // 数组的 reducers 必须是 [Object, Function] 的格式
    invariant(
      !isArray(reducers) ||
        (isPlainObject(reducers[0]) && isFunction(reducers[1])),
      "model reducers with array should be [Object, Function]"
    );
  }

  // effects 可以为空，PlainObject
  if (effects) {
    invariant(
      isPlainObject(effects),
      `model effects should be plain object, but got ${typeof effects}`
    );
  }

  if (subscriptions) {
    // subscriptions 可以为空，PlainObject
    invariant(
      isPlainObject(subscriptions),
      `model subscriptions should be plain object, but got ${typeof subscriptions}`
    );

    // subscription 必须为函数
    invariant(
      isAllFunction(subscriptions),
      "model subscription should be function"
    );
  }
}

function isAllFunction(obj) {
  return Object.keys(obj).every((key) => isFunction(obj[key]));
}
