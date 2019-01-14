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
  withRouter
} from 'react-router-dom'
import * as routerRedux from 'connected-react-router'
import React from 'react'

const createServerRouter = (location, context) => {
  return (props) => {
    return <StaticRouter {...props} location={location} context={context} />
  }
}

const createClientRouter = (history) => {
  return (props) => {
    return <routerRedux.ConnectedRouter {...props} history={history} />
  }
}

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
  routerRedux
}
