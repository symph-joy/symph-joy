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

controller.addEnhancer((Component) => {
  const withRouterComp = withRouter(Component)
  return withRouterComp
})

module.exports = controller
export default controller.controller
