import React, { createContext, ReactElement, useMemo } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { ReactReduxService } from "./redux/react-redux.service";
import { IReactApplication } from "./interfaces";
import { RuntimeException } from "@symph/core";
import ReactAppComponent, { TReactAppComponent } from "./react-app-component";

export const ReactApplicationReactContext = createContext<IReactApplication | undefined>(undefined);

interface ApplicationComponentProps {
  appContext: IReactApplication;
  children?: JSX.Element;
  // Component?: TReactAppComponent;
  err?: Error | null;
}

export function ReactAppContainer({ appContext, children, err }: ApplicationComponentProps): React.ComponentElement<any, any> {
  const [reduxStore, ReactRouterComponent, reactRouterProps] = useMemo(() => {
    return [
      appContext.getSync(ReactReduxService),
      appContext.getSync("reactRouterComponent") as { new (...args: any): any },
      appContext.getOptionalSync<Record<string, any>>("reactRouterProps"),
    ];
  }, []);

  if (!reduxStore) {
    throw new RuntimeException("ReactReduxService has not registered in context");
  }
  if (!ReactRouterComponent) {
    throw new RuntimeException("reactRouter has not registered in context");
  }

  children = children || <ReactAppComponent />;
  return (
    <ReactApplicationReactContext.Provider value={appContext}>
      <ReduxProvider store={reduxStore.store}>
        <ReactRouterComponent {...(reactRouterProps || {})}>
          {/*<Component appContext={appContext} err={err} />*/}
          {children}
        </ReactRouterComponent>
      </ReduxProvider>
    </ReactApplicationReactContext.Provider>
  );
}

export function renderComponent(props: ApplicationComponentProps): ReactElement {
  return <ReactAppContainer {...props} />;
}
