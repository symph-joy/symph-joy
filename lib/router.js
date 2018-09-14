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
import { stringify } from 'querystring'

const createServerRouter = (pathname, query) => {
  return (props) => {
    return <StaticRouter {...props} location={{pathname, search: (query ? stringify(query) : '')}} />
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
