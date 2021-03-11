import React, { createContext } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { IJoyContext } from "../interfaces";
import { ReduxStore } from "./redux/redux-store";
import { ReactApplicationContext } from "./react-application-context";

export const TempoContext = createContext<IJoyContext>(null);

export function ApplicationComponent({
  app,
  children,
}: {
  app: IJoyContext;
  children?: any;
}): React.ComponentElement<any, any> {
  const reduxStore = app.syncGetProvider(ReduxStore);
  return (
    <TempoContext.Provider value={app}>
      <ReduxProvider store={reduxStore.store}>{children}</ReduxProvider>
    </TempoContext.Provider>
  );
}

function createApplicationComponent(
  app: ReactApplicationContext
): React.ComponentType {
  return function (props: {}) {
    return <ApplicationComponent app={app} {...props} />;
  };
}

/**
 * Left for backward-compatibility reasons
 */
export default createApplicationComponent;
