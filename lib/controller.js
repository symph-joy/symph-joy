import React from 'react'
import * as controller from '@symph/tempo/controller'
import { Route } from './router'
import PropTypes from 'prop-types'
import hoistStatics from 'hoist-non-react-statics'

/**
 * react-router: Dealing with Update Blocking
 */
function withRouter (Component) {
  class Wrapper extends React.PureComponent {
    render () {
      const { wrappedComponentRef, ...remainingProps } = this.props
      return (
        <Route
          children={routeComponentProps => (
            <Component
              {...remainingProps}
              {...routeComponentProps}
              ref={wrappedComponentRef}
            />
          )}
        />
      )
    }
  }

  Wrapper.displayName = `withRouter(${Component.displayName || Component.name})`
  Wrapper.WrappedComponent = Component

  if (process.env.NODE_ENV !== 'production') {
    Wrapper.propTypes = {
      wrappedComponentRef: PropTypes.func
    }
  }
  return hoistStatics(Wrapper, Component)
}

const originalController = controller.controller
const enhanceController = function (mapStateToProps, { hotLoader, enhance } = {}) {
  function _enhance (enhancers) {
    if (hotLoader) {
      // 添加react-hot-loader在所有高阶封装之前，否则不会生效
      // hotLoader参数，一般来至于joy-react-hot-loader-label-plugin.js在调试模式下自动添加
      if (typeof hotLoader === 'function') {
        enhancers.unshift(hotLoader)
      } else {
        throw new Error('controller: hot loader must be a function or null. not a ' + (typeof hotLoader))
      }
    }

    // 添加路由封装，history state发现改变后，通知路由组件重新渲染
    enhancers.push(withRouter)

    if (enhance && typeof enhance === 'function') {
      enhancers = enhance(enhancers) || enhancers
    }
    return enhancers
  }

  return originalController(mapStateToProps, { enhance: _enhance })
}
controller.controller = enhanceController

module.exports = controller
module.exports.default = enhanceController
