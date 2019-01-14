import React from 'react'
import { Redirect } from '@symph/joy/router'

export default class ERR302 extends React.Component {
  render () {
    return (
      <div>
        <h1>redirect to </h1>
        <Redirect exact from='/redirect' to={'/302_target'} />
      </div>
    )
  }
}
