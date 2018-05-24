import {StaticRouter, BrowserRouter, Switch, Route, Link} from 'react-router-dom'
import {ConnectedRouter} from 'react-router-redux'
import React from 'react'

const createServerRouter = (pathname, query) => {
  return (props) => {
    return <StaticRouter {...props} location={{pathname, query}} />
  }
}

const createClientRouter = (history) => {
  return (props) => {
    return <ConnectedRouter {...props} history={history} />
  }
}

export {StaticRouter, BrowserRouter, Switch, Route, createServerRouter, createClientRouter, Link}
