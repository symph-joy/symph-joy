import * as controller from '@symph/tempo/controller'
import { withRouter } from 'react-router-dom'

controller.addEnhancer((Component) => {
  const withRouterComp = withRouter(Component)
  return withRouterComp
})

module.exports = controller
