import { AnyAction, Action } from "./types/actions";
import { ActionFromReducersMapObject, Reducer, ReducersMapObject, StateFromReducersMapObject } from "./types/reducers";
import { CombinedState } from "./types/store";

import ActionTypes from "./utils/actionTypes";
import isPlainObject from "./utils/isPlainObject";
import warning from "./utils/warning";

function getUndefinedStateErrorMessage(key: string, action: Action) {
  const actionType = action && action.type;
  const actionDescription = (actionType && `action "${String(actionType)}"`) || "an action";

  return `Given ${actionDescription}, reducer "${key}" returned undefined. ` + `To ignore an action, you must explicitly return the previous state. ` + `If you want this reducer to hold no value, you can return null instead of undefined.`;
}

function getUnexpectedStateShapeWarningMessage(inputState: object, reducers: ReducersMapObject, action: Action, unexpectedKeyCache: { [key: string]: true }) {
  const reducerKeys = Object.keys(reducers);
  const argumentName = action && action.type === ActionTypes.INIT ? "preloadedState argument passed to createStore" : "previous state received by the reducer";

  if (reducerKeys.length === 0) {
    return "Store does not have a valid reducer. Make sure the argument passed " + "to combineReducers is an object whose values are reducers.";
  }

  if (!isPlainObject(inputState)) {
    const match = Object.prototype.toString.call(inputState).match(/\s([a-z|A-Z]+)/);
    const matchType = match ? match[1] : "";
    return `The ${argumentName} has unexpected type of "` + matchType + `". Expected argument to be an object with the following ` + `keys: "${reducerKeys.join('", "')}"`;
  }

  // modified for joy, in order to support dynamic load model
  // const unexpectedKeys = Object.keys(inputState).filter(
  //   key => !reducers.hasOwnProperty(key) && !unexpectedKeyCache[key]
  // )
  //
  // unexpectedKeys.forEach(key => {
  //   unexpectedKeyCache[key] = true
  // })
  //
  // if (action && action.type === ActionTypes.REPLACE) return
  //
  // if (unexpectedKeys.length > 0) {
  //   return (
  //     `Unexpected ${unexpectedKeys.length > 1 ? 'keys' : 'key'} ` +
  //     `"${unexpectedKeys.join('", "')}" found in ${argumentName}. ` +
  //     `Expected to find one of the known reducer keys instead: ` +
  //     `"${reducerKeys.join('", "')}". Unexpected keys will be ignored.`
  //   )
  // }
}

function assertReducerShape(reducers: ReducersMapObject) {
  Object.keys(reducers).forEach((key) => {
    const reducer = reducers[key];
    const initialState = reducer(undefined, { type: ActionTypes.INIT });

    if (typeof initialState === "undefined") {
      throw new Error(
        `Reducer "${key}" returned undefined during initialization. ` +
          `If the state passed to the reducer is undefined, you must ` +
          `explicitly return the initial state. The initial state may ` +
          `not be undefined. If you don't want to set a value for this reducer, ` +
          `you can use null instead of undefined.`
      );
    }

    if (
      typeof reducer(undefined, {
        type: ActionTypes.PROBE_UNKNOWN_ACTION(),
      }) === "undefined"
    ) {
      throw new Error(
        `Reducer "${key}" returned undefined when probed with a random type. ` +
          `Don't try to handle ${ActionTypes.INIT} or other actions in "redux/*" ` +
          `namespace. They are considered private. Instead, you must return the ` +
          `current state for any unknown actions, unless it is undefined, ` +
          `in which case you must return the initial state, regardless of the ` +
          `action type. The initial state may not be undefined, but can be null.`
      );
    }
  });
}

/**
 * Turns an object whose values are different reducer functions, into a single
 * reducer function. It will call every child reducer, and gather their results
 * into a single state object, whose keys correspond to the keys of the passed
 * reducer functions.
 *
 * @template S Combined state object type.
 *
 * @param reducers An object whose values correspond to different reducer
 *   functions that need to be combined into one. One handy way to obtain it
 *   is to use ES6 `import * as reducers` syntax. The reducers may never
 *   return undefined for any action. Instead, they should return their
 *   initial state if the state passed to them was undefined, and the current
 *   state for any unrecognized action.
 *
 * @returns A reducer function that invokes every reducer inside the passed
 *   object, and builds a state object with the same shape.
 */
export default function combineReducers<S>(reducers: ReducersMapObject<S, any>): Reducer<CombinedState<S>>;
export default function combineReducers<S, A extends Action = AnyAction>(reducers: ReducersMapObject<S, A>): Reducer<CombinedState<S>, A>;
export default function combineReducers<M extends ReducersMapObject>(reducers: M): Reducer<CombinedState<StateFromReducersMapObject<M>>, ActionFromReducersMapObject<M>>;
export default function combineReducers(reducers: ReducersMapObject) {
  const reducerKeys = Object.keys(reducers);
  const finalReducers: ReducersMapObject = {};
  for (let i = 0; i < reducerKeys.length; i++) {
    const key = reducerKeys[i];

    if (process.env.NODE_ENV !== "production") {
      if (typeof reducers[key] === "undefined") {
        warning(`No reducer provided for key "${key}"`);
      }
    }

    if (typeof reducers[key] === "function") {
      finalReducers[key] = reducers[key];
    }
  }
  const finalReducerKeys = Object.keys(finalReducers);

  // This is used to make sure we don't warn about the same
  // keys multiple times.
  let unexpectedKeyCache: { [key: string]: true };
  if (process.env.NODE_ENV !== "production") {
    unexpectedKeyCache = {};
  }

  let shapeAssertionError: Error;
  try {
    assertReducerShape(finalReducers);
  } catch (e) {
    shapeAssertionError = e;
  }

  return function combination(state: StateFromReducersMapObject<typeof reducers> = {}, action: AnyAction) {
    if (shapeAssertionError) {
      throw shapeAssertionError;
    }

    if (process.env.NODE_ENV !== "production") {
      const warningMessage = getUnexpectedStateShapeWarningMessage(state, finalReducers, action, unexpectedKeyCache);
      if (warningMessage) {
        warning(warningMessage);
      }
    }

    let hasChanged = false;
    // modified for joy， keep the prefetch data even if the model has not registered。
    const nextState: StateFromReducersMapObject<typeof reducers> = Object.assign({}, state);
    for (let i = 0; i < finalReducerKeys.length; i++) {
      const key = finalReducerKeys[i];
      const reducer = finalReducers[key];
      const previousStateForKey = state[key];
      const nextStateForKey = reducer(previousStateForKey, action);
      if (typeof nextStateForKey === "undefined") {
        const errorMessage = getUndefinedStateErrorMessage(key, action);
        throw new Error(errorMessage);
      }
      nextState[key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }
    hasChanged = hasChanged || finalReducerKeys.length !== Object.keys(state).length;
    return hasChanged ? nextState : state;
  };
}
