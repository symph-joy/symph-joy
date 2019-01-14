import React, { Component } from 'react'
import PropTypes from 'prop-types'
import shallowEquals from './shallow-equals'
import { loadGetInitialProps } from './utils'
// import { makePublicRouterInstance } from './router'
import { Provider } from '@symph/tempo/provider'

class App extends Component {
  static childContextTypes = {
    _containerProps: PropTypes.any,
    headManager: PropTypes.object
    // router: PropTypes.object,
  }

  static displayName = 'App'

  static async getInitialProps ({ Component, router, ctx }) {
    const pageProps = await loadGetInitialProps(Component, ctx)
    return { pageProps }
  }

  getChildContext () {
    const { headManager } = this.props
    return {
      headManager,
      // router: makePublicRouterInstance(this.props.router),
      _containerProps: { ...this.props }
    }
  }

  componentDidMount () {
    let { tempo } = this.props
    let storeState = tempo.getState()

    if (storeState['@@joy'].isPrepared) {
      tempo.dispatch({
        type: '@@joy/updatePrepareState',
        isPrepared: false
      })
    }
  }

  // Kept here for backwards compatibility.
  // When someone ended App they could call `super.componentDidCatch`. This is now deprecated.
  componentDidCatch (err) {
    throw err
  }

  render () {
    const { Component, appContentProps, Router, tempo } = this.props

    return <Container>
      <Provider app={tempo}>
        <Router>
          <Component {...appContentProps} />
        </Router>
      </Provider>
    </Container>
  }
}

export class Container extends Component {
  static contextTypes = {
    _containerProps: PropTypes.any
  }

  componentDidMount () {
    this.scrollToHash()
  }

  shouldComponentUpdate (joyProps) {
    // need this check not to rerender component which has already thrown an error
    return !shallowEquals(this.props, joyProps)
  }

  componentDidUpdate () {
    this.scrollToHash()
  }

  scrollToHash () {
    const { hash } = this.context._containerProps
    if (!hash) return

    const el = document.getElementById(hash)
    if (!el) return

    // If we call scrollIntoView() in here without a setTimeout
    // it won't scroll properly.
    setTimeout(() => el.scrollIntoView(), 0)
  }

  render () {
    return this.props.children
  }
}
let ExportComp = App
if (process.env.NODE_ENV === 'development') {
  const { hot } = require('react-hot-loader')
  ExportComp = hot(module)(App)
}

export default ExportComp
