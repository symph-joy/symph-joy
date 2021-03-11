import React from "react";
import _isPlainObject from "is-plain-object";
export const isPlainObject = _isPlainObject;
export const isArray = Array.isArray.bind(Array);
export const isFunction = (o: any) => typeof o === "function";
export const returnSelf = <T>(m: T) => m;
export const noop = () => {};

/**
 * Prints a warning in the console if it exists.
 *
 * @param {String} message The warning message.
 * @returns {void}
 */
export function warning(message: any) {
  /* eslint-disable no-console */
  if (typeof console !== "undefined" && typeof console.error === "function") {
    console.error(message);
  }
  /* eslint-enable no-console */
  try {
    // This error was thrown as a convenience so that if you enable
    // "break on all exceptions" in your console,
    // it would pause the execution at this line.
    throw new Error(message);
  } catch (e) {} // eslint-disable-line no-empty
}

const hasOwn = Object.prototype.hasOwnProperty;

function is(x: any, y: any) {
  if (x === y) {
    return x !== 0 || y !== 0 || 1 / x === 1 / y;
  } else {
    return Number.isNaN(x) && Number.isNaN(y);
  }
}

/**
 *
 * @param objA
 * @param objB
 * @param exclude  这些属性，不参与参与比较
 * @returns {boolean}
 */
export function shallowEqual(
  objA: any,
  objB: any,
  { exclude }: { exclude?: Array<any> } = {}
): boolean {
  if (is(objA, objB)) return true;

  if (
    typeof objA !== "object" ||
    objA === null ||
    typeof objB !== "object" ||
    objB === null
  ) {
    return false;
  }

  let keysA = Object.keys(objA);
  let keysB = Object.keys(objB);
  if (exclude && exclude.length > 0) {
    keysA = keysA.filter((i: any) => !exclude.includes(i));
    keysB = keysB.filter((i: any) => !exclude.includes(i));
  }
  if (keysA.length !== keysB.length) return false;

  for (var i = 0; i < keysA.length; i++) {
    if (!hasOwn.call(objB, keysA[i]) || !is(objA[keysA[i]], objB[keysA[i]])) {
      // console.log('>>>> prop no equat', keysA[i])
      return false;
    }
  }

  return true;
}

export function isReactClass(Component: any) {
  return !!(
    Component.prototype &&
    (Object.prototype.isPrototypeOf.call(
      React.Component.prototype,
      Component.prototype
    ) ||
    Component.prototype.isReactComponent || // react 14 support
      Component.prototype.componentWillMount ||
      Component.prototype.componentWillUnmount ||
      Component.prototype.componentDidMount ||
      Component.prototype.componentDidUnmount ||
      Component.prototype.render)
  );
}
