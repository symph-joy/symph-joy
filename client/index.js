import React from 'react'
import ReactDOM from 'react-dom'
import HeadManager from './head-manager'
import { createClientRouter } from '../lib/router'
import EventEmitter from '../lib/EventEmitter'
import { getURL, loadGetInitialProps } from '../lib/utils'
import {create as createTempo} from '@symph/tempo'
import createHistory from 'history/createBrowserHistory'
import { connectRouter, routerMiddleware } from 'connected-react-router'
import ErrorBoundary from './error-boundary'
import Loadable from '../lib/loadable'
import App from '../lib/app'

const {
  __JOY_DATA__: {
    props,
    err,
    // page,
    pathname,
    query,
    // buildId,
    // assetPrefix,
    // runtimeConfig,
    initStoreState
  },
  location
} = window

const asPath = getURL()

const headManager = new HeadManager()
const appContainer = document.getElementById('__joy')

// let lastAppProps
let webpackHMR
export let Router
export let ErrorComponent
let Component
// let App

export const emitter = new EventEmitter()

export default async ({
  webpackHMR: passedWebpackHMR
} = {}) => {
  // This makes sure this specific line is removed in production
  if (process.env.NODE_ENV === 'development') {
    webpackHMR = passedWebpackHMR
  }
  ErrorComponent = window.__JOY_ERROR
  // App = await pageLoader.loadPage('/_app')

  let initialErr = err

  try {
    Component = window.__JOY_APP_MAIN
    Component = Component.default || Component

    if (typeof Component !== 'function') {
      throw new Error(`The default export is not a React Component in Main: "${pathname}"`)
    }
  } catch (error) {
    // This catches errors like throwing in the top level of a module
    initialErr = error
  }

  await Loadable.preloadReady()

  const history = createHistory()
  const routerMid = routerMiddleware(history)
  const tempo = createTempo({
    initialState: initStoreState,
    onReducer: (rootReduce) => {
      return connectRouter(history)(rootReduce)
    }
  }, {
    initialReducer: {},
    setupMiddlewares: (middlewares) => {
      middlewares.unshift(routerMid)
      return middlewares
    }
  })
  tempo.start()

  Router = createClientRouter(history)

  const hash = location.hash.substring(1)
  render({App, Component, props, hash, err: initialErr, emitter, Router, tempo, isComponentDidPrepare: !!initStoreState})

  return emitter
}

export async function render (props) {
  if (props.err) {
    await renderError(props)
    return
  }

  try {
    await doRender(props)
  } catch (err) {
    await renderError({...props, err})
  }
}

// This method handles all runtime and debug errors.
// 404 and 500 errors are special kind of errors
// and they are still handle via the main render method.
export async function renderError (props) {
  const {App, err} = props

  if (process.env.NODE_ENV !== 'production') {
    throw webpackHMR.prepareError(err)
  }

  // Make sure we log the error to the console, otherwise users can't track down issues.
  console.error(err)

  // In production we do a normal render with the `ErrorComponent` as component.
  // If we've gotten here upon initial render, we can use the props from the server.
  // Otherwise, we need to call `getInitialProps` on `App` before mounting.
  const initProps = props.props
    ? props.props
    : await loadGetInitialProps(App, {Component: ErrorComponent, Router, ctx: {err, pathname, query, asPath}})

  await doRender({...props, err, Component: ErrorComponent, props: initProps})
}

let isInitialRender = true

function renderReactElement (reactEl, domEl) {
  // The check for `.hydrate` is there to support React alternatives like preact
  if (initStoreState && initStoreState['@@joy']['isPrepared'] && isInitialRender && typeof ReactDOM.hydrate === 'function') {
    ReactDOM.hydrate(reactEl, domEl)
  } else {
    ReactDOM.render(reactEl, domEl)
  }

  isInitialRender = false
}

async function doRender ({App, Component, props, hash, err, emitter: emitterProp = emitter, Router, tempo, isComponentDidPrepare}) {
  // Usual getInitialProps fetching is handled in next/router
  // this is for when ErrorComponent gets replaced by Component by HMR
  // if (!props && Component &&
  //   Component !== ErrorComponent &&
  //   lastAppProps.Component === ErrorComponent) {
  //   const { pathname, query, asPath } = router
  //   props = await loadGetInitialProps(App, {Component, router, ctx: {err, pathname, query, asPath}})
  // }

  // Component = Component || lastAppProps.Component
  // props = props || lastAppProps.props

  const appProps = {Component, hash, err, props, headManager, Router, tempo, isComponentDidPrepare}
  // lastAppProps has to be set before ReactDom.render to account for ReactDom throwing an error.
  // lastAppProps = appProps

  emitterProp.emit('before-reactdom-render', {Component, ErrorComponent, appProps})

  // In development runtime errors are caught by react-error-overlay.
  if (process.env.NODE_ENV === 'development') {
    renderReactElement((
      <App {...appProps} />
    ), appContainer)
  } else {
    // In production we catch runtime errors using componentDidCatch which will trigger renderError.
    const onError = async (error) => {
      try {
        await renderError({App, err: error})
      } catch (err) {
        console.error('Error while rendering error page: ', err)
      }
    }
    renderReactElement((
      <ErrorBoundary onError={onError}>
        <App {...appProps} />
      </ErrorBoundary>
    ), appContainer)
  }

  emitterProp.emit('after-reactdom-render', {Component, ErrorComponent, appProps})
}
