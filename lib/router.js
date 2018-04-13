import {StaticRouter, BrowserRouter, Switch, Route} from 'react-router-dom'
import React from 'react'

const createServerRouter = (pathname, query) => {
  return (props) => {
    return <StaticRouter {...props} location={{pathname, query}} />
  }
}

const createClientRouter = () => {
  return (props) => {
    return <BrowserRouter {...props} />
  }
}

export {StaticRouter, BrowserRouter, Switch, Route, createServerRouter, createClientRouter}
