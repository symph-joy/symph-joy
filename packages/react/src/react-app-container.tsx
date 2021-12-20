import React, { createContext, ReactElement, useMemo } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { ReactReduxService } from "./redux/react-redux.service";
import { IReactApplication } from "./interfaces";
import { RuntimeException } from "@symph/core";
import ReactAppComponent, { TReactAppComponent } from "./react-app-component";

export const JoyReactContext = createContext<IReactApplication | undefined>(undefined);

interface ApplicationComponentProps {
  appContext: IReactApplication;
  // children?: JSX.Element;
  App?: TReactAppComponent;
}

export function ReactAppContainer({ appContext, App }: ApplicationComponentProps): React.ComponentElement<any, any> {
  const [reduxStore, ReactRouterComponent, reactRouterProps] = useMemo(() => {
    return [
      appContext.getSync(ReactReduxService),
      appContext.getSync("reactRouterComponent") as { new (...args: any): any },
      appContext.getOptionalSync<Record<string, any>>("reactRouterProps"),
    ];
  }, []);
  // const ReactRouterComponent = useMemo(() => appContext.getSync("reactRouterComponent") as { new (...args: any): any }, []);
  // const reactRouterProps =  useMemo(() => appContext.getOptionalSync<Record<string, any>>("reactRouterProps"), []);
  // const reactRouter = appContext.getSync<ReactRouter>("reactRouter", {
  //   optional: true,
  // });
  if (!reduxStore) {
    throw new RuntimeException("ReactReduxService has not registered in context");
  }
  if (!ReactRouterComponent) {
    throw new RuntimeException("reactRouter has not registered in context");
  }
  // const routes = reactRouter?.getRoutes() || [];
  // const routes =  [{path: '/', providerName: 'main'}]
  App = App || ReactAppComponent;
  return (
    <JoyReactContext.Provider value={appContext}>
      <ReduxProvider store={reduxStore.store}>
        <ReactRouterComponent {...(reactRouterProps || {})}>
          <App appContext={appContext} />
        </ReactRouterComponent>
      </ReduxProvider>
    </JoyReactContext.Provider>
  );
}

export function renderComponent(props: ApplicationComponentProps): ReactElement {
  return <ReactAppContainer {...props} />;
}

// function createApplicationComponent(
//   appContext: IReactApplication
// ): React.ComponentType<ApplicationComponentProps> {
//   return function (props: Omit<ApplicationComponentProps, "appContext">) {
//     return <ReactAppContainer appContext={appContext} {...props} />;
//   };
// }
//
// /**
//  * Left for backward-compatibility reasons
//  */
// export default createApplicationComponent;
