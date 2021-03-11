import React, { createContext, ReactElement } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { ReduxStore } from "./redux/redux-store";
import { IReactRoute } from "./interfaces/react-route.interface";
import { RouteSwitch } from "./router/route-switch";
import { ReactRouter } from "./router/react-router";
import { IReactApplication } from "./interfaces";
import { RuntimeException } from "@symph/core";

export const JoyReactContext = createContext<IReactApplication | undefined>(
  undefined
);

interface ApplicationComponentProps {
  appContext: IReactApplication;
  Component:
    | React.ComponentType<{ routes?: IReactRoute[]; [key: string]: unknown }>
    | undefined;
  routes?: IReactRoute[];
}

export function ApplicationComponent({
  appContext,
  Component,
}: // routes,
ApplicationComponentProps): React.ComponentElement<any, any> {
  const reduxStore = appContext.syncGetProvider(ReduxStore);
  const ReactRouterComponent = appContext.syncGetProvider(
    "reactRouterComponent"
  ) as { new (...args: any): any };
  const reactRouterProps = appContext.syncGetProvider("reactRouterProps", {
    optional: true,
  }) as Record<string, any>;
  const reactRouter = appContext.syncGetProvider<ReactRouter>("reactRouter", {
    optional: true,
  });
  if (!reduxStore) {
    throw new RuntimeException("ReduxStore has not registered in context");
  }
  if (!ReactRouterComponent) {
    throw new RuntimeException("reactRouter has not registered in context");
  }
  const routes = reactRouter?.getRoutes() || [];
  // const routes =  [{path: '/', providerId: 'main'}]
  const ContentComponent = Component || RouteSwitch;
  return (
    <JoyReactContext.Provider value={appContext}>
      <ReduxProvider store={reduxStore.store}>
        <ReactRouterComponent {...reactRouterProps}>
          <ContentComponent routes={routes as any} a={"aaaa"} />
        </ReactRouterComponent>
      </ReduxProvider>
    </JoyReactContext.Provider>
  );
}

export function renderComponent(
  props: ApplicationComponentProps
): ReactElement {
  return <ApplicationComponent {...props} />;
}

function createApplicationComponent(
  appContext: IReactApplication
): React.ComponentType<ApplicationComponentProps> {
  return function (props: Omit<ApplicationComponentProps, "appContext">) {
    return <ApplicationComponent appContext={appContext} {...props} />;
  };
}

/**
 * Left for backward-compatibility reasons
 */
export default createApplicationComponent;
