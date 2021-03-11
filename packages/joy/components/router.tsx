import {
  StaticRouter,
  BrowserRouter,
  Switch,
  Route,
  Link,
  HashRouter,
  NavLink,
  Prompt,
  MemoryRouter,
  Redirect,
  Router,
  withRouter,
} from "react-router-dom";
import * as routerRedux from "connected-react-router";
import { Location, History } from "history";
import React from "react";

const createServerRouter = (location: Location, context: any) => {
  return (props: any) => {
    return <StaticRouter {...props} location={location} context={context} />;
  };
};

const createClientRouter = (history: History) => {
  return (props: any) => {
    return <routerRedux.ConnectedRouter {...props} history={history} />;
  };
};

export {
  StaticRouter,
  BrowserRouter,
  Switch,
  Route,
  createServerRouter,
  createClientRouter,
  Link,
  HashRouter,
  NavLink,
  Prompt,
  MemoryRouter,
  Redirect,
  Router,
  withRouter,
  routerRedux,
};
