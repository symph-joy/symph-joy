
import _isPlainObject from 'is-plain-object';

export const isPlainObject = _isPlainObject;
export const isArray = Array.isArray.bind(Array);
export const isFunction = o => typeof o === 'function';
export const returnSelf = m => m;
export const noop = () => {};

/**
 * Prints a warning in the console if it exists.
 *
 * @param {String} message The warning message.
 * @returns {void}
 */
export function warning(message) {
  /* eslint-disable no-console */
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error(message)
  }
  /* eslint-enable no-console */
  try {
    // This error was thrown as a convenience so that if you enable
    // "break on all exceptions" in your console,
    // it would pause the execution at this line.
    throw new Error(message)
  } catch (e) {} // eslint-disable-line no-empty
}
