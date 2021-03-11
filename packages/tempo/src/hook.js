import { useContext, useEffect, useState, useRef } from "react";
import { TempoContext } from "./provider";
import { shallowEqual } from "./utils";

class MissingProviderError extends Error {
  constructor() {
    super(
      "@symph/tempo/hook requires your Redux store to be passed through " +
        "context via the <@symph/tempo/provider> or <@symph/joy/provider>"
    );
  }
}

function useMappedState(mapState) {
  const tempo = useContext(TempoContext);
  const store = tempo._store;
  if (!store) {
    throw new MissingProviderError();
  }
  const runMapState = () => mapState(store.getState());

  const [derivedState, setDerivedState] = useState(runMapState);

  const lastStore = useRef(store);
  const lastMapState = useRef(mapState);

  const wrappedSetDerivedState = () => {
    const newDerivedState = runMapState();
    setDerivedState((lastDerivedState) =>
      shallowEqual(newDerivedState, lastDerivedState)
        ? lastDerivedState
        : newDerivedState
    );
  };

  // If the store or mapState change, rerun mapState
  if (lastStore.current !== store || lastMapState.current !== mapState) {
    lastStore.current = store;
    lastMapState.current = mapState;
    wrappedSetDerivedState();
  }

  useEffect(() => {
    let didUnsubscribe = false;

    // Run the mapState callback and if the result has changed, make the
    // component re-render with the new state.
    const checkForUpdates = () => {
      if (didUnsubscribe) {
        // Don't run stale listeners.
        // Redux doesn't guarantee unsubscriptions happen until next dispatch.
        return;
      }

      wrappedSetDerivedState();
    };

    // Pull data from the store after first render in case the store has
    // changed since we began.
    checkForUpdates();

    // Subscribe to the store to be notified of subsequent changes.
    const unsubscribe = store.subscribe(checkForUpdates);

    // The return value of useEffect will be called when unmounting, so
    // we use it to unsubscribe from the store.
    return () => {
      didUnsubscribe = true;
      unsubscribe();
    };
  }, [store, mapState]);

  return derivedState;
}

function useModel(modelClasses) {
  if (!modelClasses || modelClasses.length === 0) {
    throw new Error(
      "the parameter of useModel is empty, used as: useModel(Demo1ModelClass, Demo2ModelClass)"
    );
  }
  const tempo = useContext(TempoContext);
  const store = tempo._store;
  if (!store) {
    throw new MissingProviderError();
  }
  const modelObjs = modelClasses.map((m) => tempo.model(m));

  return modelObjs;
}

function useDispatch() {
  const tempo = useContext(TempoContext);
  const store = tempo._store;
  if (!store) {
    throw new MissingProviderError();
  }
  return store.dispatch;
}

function useJoyEffect(effect, inputs) {
  const isServer = typeof window === "undefined";
  const tempo = useContext(TempoContext);
  const store = tempo._store;
  if (!store) {
    throw new MissingProviderError();
  }
  const isPrepared = store.getState()["@@joy"].isPrepared;

  if (isServer && !isPrepared) {
    // on server
    const clear = effect();
    if (clear && typeof clear === "function") {
      clear();
    }
  }

  useEffect(() => {
    // on browser
    if (isServer) {
      return;
    }
    if (isPrepared) {
      return;
    }

    return effect();
  }, inputs);
}

export {
  useMappedState,
  useModel,
  useDispatch,
  useEffect as useReactEffect,
  useJoyEffect as useEffect,
};
