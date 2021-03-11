export const isUndefined = (obj: any): obj is undefined =>
  typeof obj === "undefined";
export const isObject = (fn: unknown): fn is Record<string, unknown> =>
  !isNil(fn) && typeof fn === "object";
// eslint-disable-next-line @typescript-eslint/ban-types
export const isPlainObject = (fn: any): fn is object => {
  if (!isObject(fn)) {
    return false;
  }
  const proto = Object.getPrototypeOf(fn);
  if (proto === null) {
    return true;
  }
  const ctor =
    Object.prototype.hasOwnProperty.call(proto, "constructor") &&
    proto.constructor;
  return (
    typeof ctor === "function" &&
    ctor instanceof ctor &&
    Function.prototype.toString.call(ctor) ===
      Function.prototype.toString.call(Object)
  );
};
export const validatePath = (path?: string): string =>
  path ? (path.charAt(0) !== "/" ? "/" + path : path) : "";
export const isFunction = (fn: any): fn is (...args) => any =>
  typeof fn === "function";
export const isString = (fn: any): fn is string => typeof fn === "string";
export const isConstructor = (fn: any): boolean => fn === "constructor";
export const isNil = (obj: any): obj is null | undefined =>
  isUndefined(obj) || obj === null;
export const isEmpty = (array: any): boolean => !(array && array.length > 0);
export const isSymbol = (fn: any): fn is symbol => typeof fn === "symbol";
export const isSubClass = (classA: unknown, classB: unknown): boolean => {
  if (!isFunction(classA) || !isFunction(classB)) {
    return false;
  }
  let proto = Object.getPrototypeOf(classA);
  while (proto !== Function.prototype) {
    if (proto === classB) {
      return true;
    }
    proto = Object.getPrototypeOf(proto);
  }
  return false;
};
