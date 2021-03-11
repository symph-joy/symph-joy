import React from 'react'
import controller from '@symph/joy/controller'

@controller()
export default class ERR404 extends React.Component {
  render () {
    let {staticContext} = this.props
    if (staticContext) staticContext.status = 404
    return (
      <div>
        <h1>Sorry, can’t find that.</h1>
      </div>
    )
  }
}
