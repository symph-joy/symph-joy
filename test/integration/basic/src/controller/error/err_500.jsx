import React from 'react'
import { Redirect } from '@symph/joy/router'

export default class ERR500 extends React.Component {
  render () {
    throw new Error('i am error')
    return (
      <div>
        should render the error
      </div>
    )
  }
}
