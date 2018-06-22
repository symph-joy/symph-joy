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
  Router
} from 'react-router-dom'
import { ConnectedRouter } from 'react-router-redux'
import React from 'react'
import { stringify } from 'querystring'

const createServerRouter = (pathname, query) => {
  return (props) => {
    return <StaticRouter {...props} location={{pathname, search: (query ? stringify(query) : '')}} />
  }
}

const createClientRouter = (history) => {
  return (props) => {
    return <ConnectedRouter {...props} history={history} />
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
  Router
}
