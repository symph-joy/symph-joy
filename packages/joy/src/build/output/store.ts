import createStore from "unistore";
import stripAnsi from "strip-ansi";

import * as Log from "./log";

export type OutputState =
  | { bootstrap: true; appUrl: string | null }
  | ({ bootstrap: false; appUrl: string | null } & (
      | { loading: true }
      | {
          loading: false;
          typeChecking: boolean;
          errors: string[] | null;
          warnings: string[] | null;
        }
    ));

export const store = createStore<OutputState>({
  appUrl: null,
  bootstrap: true,
});

let preState: OutputState = { appUrl: null, bootstrap: true };
function hasStoreChanged(nextState: OutputState) {
  if (
    ([...new Set([...Object.keys(preState), ...Object.keys(nextState)])] as Array<keyof OutputState>).every((key) =>
      Object.is(preState[key], nextState[key])
    )
  ) {
    return false;
  }

  preState = nextState;
  return true;
}

store.subscribe((state) => {
  const previousState = preState;
  if (!hasStoreChanged(state)) {
    return;
  }

  if (state.bootstrap) {
    return;
  }

  if (!previousState.appUrl && state.appUrl) {
    Log.ready(`started server on ${state.appUrl}`);
    return;
  }

  if (state.loading) {
    Log.wait("compiling...");
    return;
  }

  if (state.errors) {
    for (let i = 0; i < Math.min(2, state.errors.length); i++) {
      Log.error(state.errors[i]);
    }

    const cleanError = stripAnsi(state.errors[0]);
    if (cleanError.indexOf("SyntaxError") > -1) {
      const matches = cleanError.match(/\[.*\]=/);
      if (matches) {
        for (const match of matches) {
          const prop = (match.split("]").shift() || "").substr(1);
          console.log(`AMP bind syntax [${prop}]='' is not supported in JSX, use 'data-amp-bind-${prop}' instead.`);
        }
        return;
      }
    }

    return;
  }

  if (state.warnings) {
    Log.warn(state.warnings.join("\n\n"));
    if (state.appUrl) {
      Log.info(`ready on ${state.appUrl}`);
    }
    return;
  }

  if (state.typeChecking) {
    Log.info("bundled successfully, waiting for typecheck results...");
    return;
  }

  Log.event("compiled successfully");
});
