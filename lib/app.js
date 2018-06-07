import React, {Component} from 'react'
import PropTypes from 'prop-types'
import shallowEquals from './shallow-equals'
// import {warn} from './utils'
// import {makePublicRouterInstance} from './router'
import {Provider} from 'react-redux'

export default class App extends Component {
  state = {
    hasError: null
  }

  static childContextTypes = {
    headManager: PropTypes.object,
    // router: PropTypes.object,
    dva: PropTypes.object,
    isComponentDidPrepare: PropTypes.bool
  }

  constructor () {
    super(...arguments)
    console.log('> app inited, isPrepared:' + this.props.isComponentDidPrepare)
    this.isComponentDidPrepare = this.props.isComponentDidPrepare
  }

  getChildContext () {
    const {headManager} = this.props
    return {
      headManager,
      // router: makePublicRouterInstance(this.props.router),
      dva: this.props.dva,
      isComponentDidPrepare: this.isComponentDidPrepare
    }
  }

  componentDidMount () {
    this.isComponentDidPrepare = false
  }

  componentDidCatch (error, info) {
    error.stack = `${error.stack}\n\n${info.componentStack}`
    window.symphony.renderError(error)
    this.setState({hasError: true})
  }

  render () {
    if (this.state.hasError) return null

    const {Component, props, hash, Router, dva} = this.props
    // const url = createUrl(router)
    // If there no component exported we can't proceed.
    // We'll tackle that here.
    // if (typeof Component !== 'function') {
    //   throw new Error(`The default export is not a React Component in page: "${url.pathname}"`)
    // }
    const containerProps = {
      Component,
      props,
      hash,
      Router,
      // url,
      dva
    }

    return <Container {...containerProps} />
  }
}

class Container extends Component {
  componentDidMount () {
    this.scrollToHash()
  }

  componentDidUpdate () {
    this.scrollToHash()
  }

  scrollToHash () {
    const {hash} = this.props
    if (!hash) return

    const el = document.getElementById(hash)
    if (!el) return

    // If we call scrollIntoView() in here without a setTimeout
    // it won't scroll properly.
    setTimeout(() => el.scrollIntoView(), 0)
  }

  shouldComponentUpdate (symphonyProps) {
    // need this check not to rerender component which has already thrown an error
    return !shallowEquals(this.props, symphonyProps)
  }

  render () {
    const {Component, props, dva, Router} = this.props

    if (process.env.NODE_ENV === 'production') {
      return (
        <Provider store={dva._store}>
          <Router>
            <Component {...props} />
          </Router>
        </Provider>
      )
    } else {
      const ErrorDebug = require('./error-debug').default
      const {AppContainer} = require('react-hot-loader')

      // includes AppContainer which bypasses shouldComponentUpdate method
      // https://github.com/gaearon/react-hot-loader/issues/442
      return (
        <Provider store={dva._store}>
          <Router>
            <AppContainer warnings={false} errorReporter={ErrorDebug}>
              <Component {...props} />
            </AppContainer>
          </Router>
        </Provider>
      )
    }
  }
}
